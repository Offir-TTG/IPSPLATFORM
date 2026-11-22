/**
 * Conversations between a client and the school: one per enrollment
 * (with its instructor or coach) and one general one with the team.
 */

export type ThreadView = {
  /** Null until the first message: the client can still open it and write. */
  threadId: string | null;
  key: string;
  kind: 'enrollment' | 'general';
  enrollmentId: string | null;
  title: string;
  who: { name: string; role: string; avatarUrl: string | null };
  color: string;
  href: string | null;
  last: { body: string; at: string; fromMe: boolean } | null;
  unread: boolean;
};

export type MessageView = { id: string; body: string; at: string; fromMe: boolean };
