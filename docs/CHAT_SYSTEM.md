# Chat System Documentation

## Overview

The IPS Platform now includes a comprehensive real-time chat system that allows students to communicate within their programs and courses. The system uses **Supabase Realtime** for live messaging and includes proper authentication, authorization, and multi-tenancy support.

## Features

### ✅ Implemented Features

1. **Program/Course-Based Conversations**
   - Each program or course can have its own chat room
   - Students are automatically added to conversations for programs/courses they're enrolled in
   - Context-aware: Shows which program/course each conversation belongs to

2. **Real-Time Messaging**
   - Live updates using Supabase Realtime
   - See new messages instantly without refreshing
   - Typing indicators ready for implementation

3. **Modern Chat UI**
   - Clean, modern interface with conversation list and chat window
   - Message bubbles with sender information
   - Avatar support with initials
   - Timestamp showing relative time (e.g., "2 minutes ago")
   - Unread message badges

4. **Message Features**
   - Text messages
   - Reply threading (database ready)
   - Message editing (database ready)
   - Attachment support (database ready)
   - Read receipts tracking (database ready)

5. **Search & Navigation**
   - Search conversations by name or context
   - Easy navigation between conversations
   - Mobile-responsive bottom navigation

## Database Schema

### Tables Created

#### 1. `conversations`
Stores chat rooms for programs or courses.

```sql
- id: UUID (primary key)
- tenant_id: UUID (multi-tenancy)
- name: TEXT (conversation name)
- description: TEXT
- program_id: UUID (if program chat)
- course_id: UUID (if course chat)
- created_by: UUID (creator)
- avatar_url: TEXT
- is_active: BOOLEAN
- last_message_at: TIMESTAMPTZ
- created_at, updated_at: TIMESTAMPTZ
```

#### 2. `conversation_participants`
Tracks who's in each conversation.

```sql
- id: UUID (primary key)
- conversation_id: UUID (foreign key)
- user_id: UUID (foreign key)
- role: TEXT (member/moderator/admin)
- last_read_at: TIMESTAMPTZ
- unread_count: INTEGER
- is_muted: BOOLEAN
- joined_at, left_at: TIMESTAMPTZ
```

#### 3. `messages`
Stores all chat messages.

```sql
- id: UUID (primary key)
- conversation_id: UUID (foreign key)
- sender_id: UUID (foreign key)
- content: TEXT
- message_type: TEXT (text/image/file/system)
- attachment_url, attachment_name, attachment_size: TEXT/INTEGER
- reply_to_id: UUID (for threading)
- is_edited, is_deleted: BOOLEAN
- edited_at, deleted_at, created_at: TIMESTAMPTZ
```

#### 4. `message_reads`
Optional read receipt tracking.

```sql
- id: UUID (primary key)
- message_id: UUID (foreign key)
- user_id: UUID (foreign key)
- read_at: TIMESTAMPTZ
```

## API Routes

### GET /api/chat/conversations
Get all conversations for the authenticated user.

**Response:**
```json
{
  "conversations": [
    {
      "conversation_id": "uuid",
      "conversation_name": "Advanced React Course",
      "context_type": "course",
      "context_name": "Web Development Program",
      "unread_count": 5,
      "participant_count": 25,
      "last_message_at": "2025-01-21T10:30:00Z",
      "last_message_content": "Great question!",
      "last_message_sender_name": "John Doe"
    }
  ]
}
```

### POST /api/chat/conversations
Create a new conversation for a program or course.

**Request:**
```json
{
  "name": "Course Discussion",
  "description": "General discussion for the course",
  "tenantId": "uuid",
  "programId": "uuid" // OR courseId
}
```

### GET /api/chat/conversations/[id]/messages
Get messages for a specific conversation with pagination.

**Query Parameters:**
- `limit`: Number of messages to fetch (default: 50)
- `before`: Message ID for pagination

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "content": "Hello everyone!",
      "message_type": "text",
      "sender": {
        "id": "uuid",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com"
      },
      "created_at": "2025-01-21T10:30:00Z",
      "is_edited": false,
      "is_deleted": false
    }
  ]
}
```

### POST /api/chat/conversations/[id]/messages
Send a message to a conversation.

**Request:**
```json
{
  "content": "Hello everyone!",
  "messageType": "text",
  "replyToId": "uuid" // Optional
}
```

## How to Set Up

### 1. Run Database Migration

Execute the migration file in Supabase SQL Editor:

```sql
-- File: supabase/migrations/20251121_create_chat_system.sql
```

This creates:
- All 4 tables (conversations, conversation_participants, messages, message_reads)
- Indexes for performance
- RLS policies for security
- Helper functions (get_user_conversations, mark_conversation_as_read)
- Triggers (auto-update last_message_at, unread counts)

### 2. Enable Supabase Realtime

In your Supabase project dashboard:

1. Go to **Database** → **Replication**
2. Enable realtime for the `messages` table
3. Select "INSERT" and "UPDATE" events

### 3. Create Conversations for Programs/Courses

You have two options:

#### Option A: Manual Creation (Admin Panel)
Create an admin interface to create conversations when programs/courses are created.

#### Option B: Automatic Creation
Create a database trigger to auto-create conversations:

```sql
CREATE OR REPLACE FUNCTION create_default_conversation_for_program()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO conversations (
    tenant_id,
    name,
    description,
    program_id,
    created_by
  ) VALUES (
    NEW.tenant_id,
    NEW.name || ' - Discussion',
    'General discussion for ' || NEW.name,
    NEW.id,
    NEW.created_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_program_conversation
  AFTER INSERT ON programs
  FOR EACH ROW
  EXECUTE FUNCTION create_default_conversation_for_program();
```

### 4. Add Students to Conversations

When a student enrolls in a program/course, add them to the conversation:

```sql
-- Add participant when enrollment is created
INSERT INTO conversation_participants (
  conversation_id,
  user_id,
  role
)
SELECT
  c.id,
  NEW.user_id,
  'member'
FROM conversations c
WHERE c.program_id = NEW.program_id
  OR c.course_id = NEW.course_id;
```

## Usage

### Accessing the Chat

Students can access the chat from:
1. **Mobile Navigation**: Bottom bar → Chat icon
2. **Direct URL**: `/chat`

### Sending Messages

1. Select a conversation from the sidebar
2. Type message in the input field at the bottom
3. Press Enter or click Send button
4. Message appears instantly for all participants

### Real-Time Updates

- New messages appear automatically without refresh
- Unread counts update in real-time
- Last message preview updates automatically

## Code Structure

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       ├── conversations/
│   │       │   ├── route.ts              # Get/create conversations
│   │       │   └── [id]/
│   │       │       └── messages/
│   │       │           └── route.ts      # Get/send messages
│   └── (user)/
│       └── chat/
│           └── page.tsx                  # Main chat UI
├── hooks/
│   └── useChat.ts                        # Chat state management + realtime
└── components/
    └── user/
        └── UserLayout.tsx                # Added chat nav link

supabase/
└── migrations/
    └── 20251121_create_chat_system.sql   # Database schema
```

## Security

### Row Level Security (RLS)

All tables have RLS policies enforced:

1. **Conversations**: Users can only see conversations they're participating in
2. **Messages**: Users can only see/send messages in their conversations
3. **Participants**: Users can only see participants in their conversations

### Authentication

- All API routes require authentication
- JWT token validation on every request
- User ID from token used for authorization

### Multi-Tenancy

- All data is scoped by `tenant_id`
- Users can only access data within their tenant

## Future Enhancements

### Ready to Implement (Database Already Supports)

1. **Attachments**
   - File upload via storage bucket
   - Image previews
   - File download

2. **Message Threading**
   - Reply to specific messages
   - Show reply context

3. **Message Editing**
   - Edit own messages
   - Show edit indicator

4. **Read Receipts**
   - Track who read each message
   - Show read status

5. **Typing Indicators**
   - Show when someone is typing
   - Use Supabase presence

### Future Features

1. **Reactions**
   - Add emoji reactions to messages
   - Like/react tracking

2. **Mentions**
   - @mention specific users
   - Mention notifications

3. **Moderation**
   - Delete messages (moderator)
   - Mute users
   - Pin important messages

4. **Search**
   - Full-text search in messages
   - Filter by sender, date, etc.

5. **Notifications**
   - Push notifications for new messages
   - Email digest

## Troubleshooting

### Messages Not Appearing in Real-Time

1. Check Supabase Realtime is enabled for `messages` table
2. Verify INSERT event is selected in replication settings
3. Check browser console for WebSocket errors

### User Can't See Conversations

1. Verify user is in `conversation_participants` table
2. Check `left_at` is NULL
3. Verify RLS policies are correctly set up

### Can't Send Messages

1. Check user is authenticated (valid session)
2. Verify user is participant in conversation
3. Check API route logs for errors

## Testing

### Test the Chat System

1. **Create Test Data**:
   ```sql
   -- Create a test conversation
   INSERT INTO conversations (tenant_id, name, program_id, created_by)
   VALUES ('your-tenant-id', 'Test Chat', 'program-id', 'your-user-id');

   -- Add yourself as participant
   INSERT INTO conversation_participants (conversation_id, user_id)
   VALUES ('conversation-id', 'your-user-id');
   ```

2. **Test Real-Time**:
   - Open chat in two browser windows/tabs
   - Send message in one window
   - Should appear instantly in the other

3. **Test API Routes**:
   ```bash
   # Get conversations
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:3000/api/chat/conversations

   # Send message
   curl -X POST \
        -H "Authorization: Bearer YOUR_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"content": "Test message"}' \
        http://localhost:3000/api/chat/conversations/CONV_ID/messages
   ```

## Performance Considerations

1. **Message Pagination**: Loads 50 messages at a time
2. **Indexed Queries**: All queries use database indexes
3. **Realtime Channels**: One channel per conversation
4. **Unread Counts**: Automatically tracked via database triggers

## Support

For questions or issues with the chat system:
1. Check this documentation
2. Review database logs in Supabase
3. Check browser console for JavaScript errors
4. Verify API route responses in Network tab
