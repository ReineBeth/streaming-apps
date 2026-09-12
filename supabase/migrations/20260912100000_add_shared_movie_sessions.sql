create table public.shared_movie_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  access_token text not null unique check (char_length(access_token) between 32 and 128),
  filters jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.shared_movie_session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.shared_movie_sessions (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  participant_token text not null unique check (char_length(participant_token) between 32 and 128),
  display_name text not null check (char_length(trim(display_name)) between 1 and 40),
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (session_id, id)
);

create unique index shared_movie_session_owner_idx
  on public.shared_movie_session_participants (session_id, user_id)
  where user_id is not null;

create table public.shared_movie_session_titles (
  session_id uuid not null references public.shared_movie_sessions (id) on delete cascade,
  position smallint not null check (position between 0 and 9),
  tmdb_id integer not null check (tmdb_id > 0),
  media_type public.media_type not null,
  title text not null check (char_length(trim(title)) > 0),
  overview text not null default '',
  year integer,
  poster_path text,
  tmdb_rating numeric(3, 1),
  primary key (session_id, position),
  unique (session_id, tmdb_id, media_type)
);

create table public.shared_movie_session_votes (
  participant_id uuid not null references public.shared_movie_session_participants (id) on delete cascade,
  session_id uuid not null references public.shared_movie_sessions (id) on delete cascade,
  tmdb_id integer not null,
  media_type public.media_type not null,
  liked boolean not null,
  created_at timestamptz not null default now(),
  primary key (participant_id, tmdb_id, media_type)
);

create index shared_movie_session_participants_session_idx
  on public.shared_movie_session_participants (session_id);

create index shared_movie_session_votes_session_idx
  on public.shared_movie_session_votes (session_id, tmdb_id, media_type);

alter table public.shared_movie_sessions enable row level security;
alter table public.shared_movie_session_participants enable row level security;
alter table public.shared_movie_session_titles enable row level security;
alter table public.shared_movie_session_votes enable row level security;

create or replace function public.create_shared_movie_session(
  p_access_token text,
  p_participant_token text,
  p_display_name text,
  p_filters jsonb,
  p_titles jsonb,
  p_expires_at timestamptz
)
returns table (session_id uuid, participant_id uuid, participant_token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_session_id uuid;
  new_participant_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  if p_access_token is null or p_participant_token is null or char_length(trim(p_display_name)) not between 1 and 40 then
    raise exception 'invalid_session_input';
  end if;

  insert into public.shared_movie_sessions (owner_user_id, access_token, filters, expires_at)
  values (auth.uid(), p_access_token, coalesce(p_filters, '{}'::jsonb), p_expires_at)
  returning id into new_session_id;

  insert into public.shared_movie_session_participants (session_id, user_id, participant_token, display_name)
  values (new_session_id, auth.uid(), p_participant_token, trim(p_display_name))
  returning id into new_participant_id;

  insert into public.shared_movie_session_titles (session_id, position, tmdb_id, media_type, title, overview, year, poster_path, tmdb_rating)
  select new_session_id, item.position, item.tmdb_id, item.media_type, item.title, coalesce(item.overview, ''), item.year, item.poster_path, item.tmdb_rating
  from jsonb_to_recordset(coalesce(p_titles, '[]'::jsonb)) as item(
    position smallint,
    tmdb_id integer,
    media_type public.media_type,
    title text,
    overview text,
    year integer,
    poster_path text,
    tmdb_rating numeric(3, 1)
  );

  return query select new_session_id, new_participant_id, p_participant_token, p_expires_at;
end;
$$;

create or replace function public.join_shared_movie_session(
  p_access_token text,
  p_participant_token text,
  p_display_name text
)
returns table (session_id uuid, participant_id uuid, participant_token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session public.shared_movie_sessions%rowtype;
  new_participant_id uuid;
begin
  select * into target_session
  from public.shared_movie_sessions
  where access_token = p_access_token
    and expires_at > now();

  if not found then raise exception 'session_not_found'; end if;
  if char_length(trim(p_display_name)) not between 1 and 40 then raise exception 'invalid_display_name'; end if;

  select id into new_participant_id
  from public.shared_movie_session_participants
  where session_id = target_session.id and participant_token = p_participant_token;

  if new_participant_id is null then
    if (select count(*) from public.shared_movie_session_participants where session_id = target_session.id) >= 2 then
      raise exception 'session_full';
    end if;

    insert into public.shared_movie_session_participants (session_id, user_id, participant_token, display_name)
    values (target_session.id, auth.uid(), p_participant_token, trim(p_display_name))
    returning id into new_participant_id;
  end if;

  return query select target_session.id, new_participant_id, p_participant_token, target_session.expires_at;
end;
$$;

create or replace function public.get_shared_movie_session(
  p_access_token text,
  p_participant_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session public.shared_movie_sessions%rowtype;
  target_participant public.shared_movie_session_participants%rowtype;
begin
  select * into target_session
  from public.shared_movie_sessions
  where access_token = p_access_token and expires_at > now();
  if not found then raise exception 'session_not_found'; end if;

  select * into target_participant
  from public.shared_movie_session_participants
  where session_id = target_session.id and participant_token = p_participant_token;
  if not found then raise exception 'participant_not_found'; end if;

  return jsonb_build_object(
    'session', jsonb_build_object('id', target_session.id, 'filters', target_session.filters, 'expires_at', target_session.expires_at),
    'participant', jsonb_build_object('id', target_participant.id, 'display_name', target_participant.display_name),
    'participants', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'display_name', p.display_name, 'completed', p.completed_at is not null) order by p.joined_at) from public.shared_movie_session_participants p where p.session_id = target_session.id), '[]'::jsonb),
    'titles', coalesce((select jsonb_agg(jsonb_build_object('tmdb_id', t.tmdb_id, 'media_type', t.media_type, 'title', t.title, 'position', t.position, 'overview', t.overview, 'year', t.year, 'poster_path', t.poster_path, 'tmdb_rating', t.tmdb_rating) order by t.position) from public.shared_movie_session_titles t where t.session_id = target_session.id), '[]'::jsonb),
    'votes', coalesce((select jsonb_agg(jsonb_build_object('participant_id', v.participant_id, 'tmdb_id', v.tmdb_id, 'media_type', v.media_type, 'liked', v.liked)) from public.shared_movie_session_votes v where v.session_id = target_session.id and (v.participant_id = target_participant.id or not exists (select 1 from public.shared_movie_session_participants incomplete where incomplete.session_id = target_session.id and incomplete.completed_at is null))), '[]'::jsonb)
  );
end;
$$;

create or replace function public.vote_shared_movie_title(
  p_access_token text,
  p_participant_token text,
  p_tmdb_id integer,
  p_media_type public.media_type,
  p_liked boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session_id uuid;
  target_participant_id uuid;
begin
  select s.id, p.id into target_session_id, target_participant_id
  from public.shared_movie_sessions s
  join public.shared_movie_session_participants p on p.session_id = s.id
  where s.access_token = p_access_token and s.expires_at > now() and p.participant_token = p_participant_token;
  if target_session_id is null then raise exception 'session_or_participant_not_found'; end if;
  if not exists (select 1 from public.shared_movie_session_titles where session_id = target_session_id and tmdb_id = p_tmdb_id and media_type = p_media_type) then raise exception 'title_not_in_session'; end if;

  insert into public.shared_movie_session_votes (participant_id, session_id, tmdb_id, media_type, liked)
  values (target_participant_id, target_session_id, p_tmdb_id, p_media_type, p_liked)
  on conflict (participant_id, tmdb_id, media_type) do update set liked = excluded.liked;

  update public.shared_movie_session_participants
  set completed_at = case when (select count(*) from public.shared_movie_session_votes where participant_id = target_participant_id) = (select count(*) from public.shared_movie_session_titles where session_id = target_session_id) then coalesce(completed_at, now()) else null end
  where id = target_participant_id;
end;
$$;

revoke all on function public.create_shared_movie_session(text, text, text, jsonb, jsonb, timestamptz) from public;
revoke all on function public.join_shared_movie_session(text, text, text) from public;
revoke all on function public.get_shared_movie_session(text, text) from public;
revoke all on function public.vote_shared_movie_title(text, text, integer, public.media_type, boolean) from public;
grant execute on function public.create_shared_movie_session(text, text, text, jsonb, jsonb, timestamptz) to authenticated;
grant execute on function public.join_shared_movie_session(text, text, text) to anon, authenticated;
grant execute on function public.get_shared_movie_session(text, text) to anon, authenticated;
grant execute on function public.vote_shared_movie_title(text, text, integer, public.media_type, boolean) to anon, authenticated;
