-- Supabase schema setup for conversations & messages

-- Enable required extension for gen_random_uuid (usually enabled by default on Supabase)
create extension if not exists "pgcrypto";

-- 1. conversations table
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '新对话',
  model text not null default 'gpt-3.5-turbo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens_used integer not null default 0,
  created_at timestamptz not null default now()
);

-- 3. Enable Row Level Security (RLS)
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- 4. RLS policies

-- conversations: user can only SELECT/INSERT/UPDATE/DELETE their own rows
create policy "conversations_owner_all"
on public.conversations
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- messages: user can only operate on messages that belong to their conversations
create policy "messages_conversation_owner_all"
on public.messages
for all
using (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.conversations c
    where c.id = messages.conversation_id
      and c.user_id = auth.uid()
  )
);

