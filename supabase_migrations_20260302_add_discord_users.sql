-- 创建或调整用户表以支持邮箱密码和 Discord 登录
-- 如果已经存在 users 表，请根据需要手动合并字段定义

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  password_hash text,
  username text not null,
  discord_id text unique,
  discord_avatar text,
  auth_provider text not null default 'email',
  created_at timestamptz not null default now()
);

create unique index if not exists users_discord_id_key on public.users(discord_id);
create index if not exists users_email_idx on public.users(email);

