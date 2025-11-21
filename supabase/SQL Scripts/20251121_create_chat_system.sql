-- Chat System Migration
-- Creates tables for real-time messaging with program/course context

-- Conversations table (group chats for programs/courses)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- Context: program or course
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Either program_id or course_id should be set, not both
  CONSTRAINT conversation_context CHECK (
    (program_id IS NOT NULL AND course_id IS NULL) OR
    (program_id IS NULL AND course_id IS NOT NULL)
  )
);

-- Conversation participants (students enrolled in the program/course)
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Participant role
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  -- Read tracking
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  -- Status
  is_muted BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  -- Unique participant per conversation
  UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Message content
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  -- Attachments
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size INTEGER,
  -- Reply threading
  reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  -- Metadata
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message reads tracking (optional - for read receipts)
CREATE TABLE IF NOT EXISTS message_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_program ON conversations(program_id);
CREATE INDEX IF NOT EXISTS idx_conversations_course ON conversations(course_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);

CREATE INDEX IF NOT EXISTS idx_message_reads_message ON message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);

-- Function to update conversation's last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_message_at when new message is created
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to update unread counts
CREATE OR REPLACE FUNCTION update_unread_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment unread count for all participants except the sender
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
    AND left_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update unread counts when new message is created
DROP TRIGGER IF EXISTS trigger_update_unread_counts ON messages;
CREATE TRIGGER trigger_update_unread_counts
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_counts();

-- Function to mark messages as read and reset unread count
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  -- Update last_read_at and reset unread_count
  UPDATE conversation_participants
  SET last_read_at = NOW(),
      unread_count = 0
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's conversations with context
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE(
  conversation_id UUID,
  conversation_name TEXT,
  conversation_description TEXT,
  conversation_avatar TEXT,
  context_type TEXT,
  context_id UUID,
  context_name TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER,
  participant_count BIGINT,
  last_message_content TEXT,
  last_message_sender_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id as conversation_id,
    c.name as conversation_name,
    c.description as conversation_description,
    c.avatar_url as conversation_avatar,
    CASE
      WHEN c.program_id IS NOT NULL THEN 'program'
      WHEN c.course_id IS NOT NULL THEN 'course'
    END as context_type,
    COALESCE(c.program_id, c.course_id) as context_id,
    COALESCE(p.name, co.name) as context_name,
    c.last_message_at,
    cp.unread_count,
    (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id AND left_at IS NULL) as participant_count,
    (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_content,
    (SELECT u.first_name || ' ' || u.last_name
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.conversation_id = c.id
     ORDER BY m.created_at DESC
     LIMIT 1) as last_message_sender_name
  FROM conversations c
  JOIN conversation_participants cp ON c.id = cp.conversation_id
  LEFT JOIN programs p ON c.program_id = p.id
  LEFT JOIN courses co ON c.course_id = co.id
  WHERE cp.user_id = p_user_id
    AND cp.left_at IS NULL
    AND c.is_active = true
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can see conversations they're participating in
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
        AND left_at IS NULL
    )
  );

-- Conversation participants: Users can view participants in their conversations
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- Messages: Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- Messages: Users can insert messages in their conversations
CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- Messages: Users can update their own messages (for editing)
CREATE POLICY "Users can edit their own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Message reads: Users can view read receipts
CREATE POLICY "Users can view message reads"
  ON message_reads FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM messages
      WHERE conversation_id IN (
        SELECT conversation_id FROM conversation_participants
        WHERE user_id = auth.uid() AND left_at IS NULL
      )
    )
  );

-- Message reads: Users can mark messages as read
CREATE POLICY "Users can mark messages as read"
  ON message_reads FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT SELECT, INSERT ON message_reads TO authenticated;

-- Comments
COMMENT ON TABLE conversations IS 'Chat conversations linked to programs or courses';
COMMENT ON TABLE conversation_participants IS 'Users participating in conversations';
COMMENT ON TABLE messages IS 'Chat messages within conversations';
COMMENT ON TABLE message_reads IS 'Track which users have read which messages';
