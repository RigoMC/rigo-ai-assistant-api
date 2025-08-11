create extension if not exists vector;
create extension if not exists pgcrypto;
create table users (
                       id uuid primary key default gen_random_uuid(),
                       email text unique not null,
                       password_hash text not null,
                       created_at timestamptz default now()
);
insert into users (email, password_hash)
values (
           'developer@developer.com',
           crypt('developer', gen_salt('bf')) -- bcrypt
       );
create table documents (
                           id uuid primary key default gen_random_uuid(),
                           user_id uuid references users(id) on delete cascade,
                           content text not null,
                           metadata jsonb,
                           embedding vector(1536),
                           created_at timestamptz default now()
);
create table notes (
                       id uuid primary key default gen_random_uuid(),
                       user_id uuid references users(id) on delete cascade,
                       title text,
                       content text,
                       created_at timestamptz default now()
);
create table chats (
                       id uuid primary key default gen_random_uuid(),
                       user_id uuid references users(id) on delete cascade,
                       title text default 'Nuevo chat',
                       created_at timestamptz default now()
);
create table chat_messages (
                               id uuid primary key default gen_random_uuid(),
                               chat_id uuid references chats(id) on delete cascade,
                               role text check (role in ('system', 'user', 'assistant')) not null,
                               content text not null,
                               created_at timestamptz default now()
);
create or replace function match_documents(
    p_user_id uuid,
    query_embedding vector,
    match_count int
)
returns table (id uuid, content text, metadata jsonb, distance float)
language sql stable as $$
select id, content, metadata, embedding <-> query_embedding as distance
from documents
where user_id = p_user_id
order by distance
    limit match_count;
$$;
