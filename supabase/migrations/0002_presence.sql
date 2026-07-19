-- Kimin bağlı olduğunu takip eder (30 sn sessiz kalan "düşmüş" sayılır).
-- ÖNEMLİ: realtime publication'a EKLENMEZ; yoksa her sinyal tüm ekranları tetikler.
create table if not exists public.presence (
  room_code    text not null references public.rooms(code) on delete cascade,
  user_id      uuid not null,
  last_seen_at timestamptz not null default now(),
  primary key (room_code, user_id)
);
create index if not exists idx_presence_room on public.presence(room_code);

alter table public.presence enable row level security;
-- Yazma/okuma sunucu (service role) üzerinden yapılır; anon erişim yok.
