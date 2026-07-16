-- ============================================================
-- "Nasıl Anlatsam?" — Supabase / Postgres şeması (1. göç)
-- ============================================================
-- Not: Yetkili (authoritative) yazma işlemleri Vercel API'sinden
-- SERVICE ROLE anahtarıyla yapılır (RLS'i bypass eder). İstemciler
-- yalnızca OKUR ve Realtime ile canlı güncelleme alır.
-- ============================================================

-- ---------- STATİK İÇERİK: DESTE & KARTLAR ----------
create table if not exists public.decks (
  id         text primary key,
  name       text not null,
  language   text not null default 'tr',
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id              text primary key,
  deck_id         text not null references public.decks(id) on delete cascade,
  main_word       text not null,
  forbidden_words jsonb not null,             -- ["...","...",...] tam 7
  category        text
);
create index if not exists idx_cards_deck on public.cards(deck_id);

-- ---------- ODALAR (canlı oyun durumu) ----------
create table if not exists public.rooms (
  code           text primary key,            -- 8 haneli, sadece rakam
  host_user_id   uuid,
  phase          text not null default 'LOBBY',
  settings       jsonb not null,
  teams          jsonb not null,              -- { teamA:{...}, teamB:{...} }
  round          int  not null default 0,
  turn_order     jsonb not null default '[]', -- slotId sırası (dönüşümlü)
  turn_index     int  not null default 0,
  active_turn    jsonb,                        -- ActiveTurn | null
  deck_card_ids  jsonb not null default '[]',
  used_card_ids  jsonb not null default '[]',
  winner_team_id text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- SLOTLAR (oyuncu isimleri / sahiplenme) ----------
create table if not exists public.slots (
  slot_id            uuid primary key default gen_random_uuid(),
  room_code          text not null references public.rooms(code) on delete cascade,
  name               text not null,
  team_id            text not null check (team_id in ('teamA','teamB')),
  turn_position      int  not null,
  is_host            boolean not null default false,
  is_captain         boolean not null default false,
  claimed_by_user_id uuid,                     -- null => boş slot (seçilebilir)
  connected          boolean not null default false,
  avatar             text,
  created_at         timestamptz not null default now()
);
create index if not exists idx_slots_room on public.slots(room_code);
-- Bir kullanıcı aynı odada yalnızca tek slot sahiplenebilsin:
create unique index if not exists uniq_slot_claim
  on public.slots(room_code, claimed_by_user_id)
  where claimed_by_user_id is not null;

-- ---------- updated_at otomatik güncelleme ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_rooms_touch on public.rooms;
create trigger trg_rooms_touch before update on public.rooms
  for each row execute function public.touch_updated_at();

-- ============================================================
-- REALTIME: istemciler bu tabloları canlı dinler
-- ============================================================
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.slots;

-- ============================================================
-- RLS: herkes okuyabilir; yazma yalnızca service role (sunucu)
-- ============================================================
alter table public.rooms  enable row level security;
alter table public.slots  enable row level security;
alter table public.cards  enable row level security;
alter table public.decks  enable row level security;

-- Okuma serbest (istemci Realtime + ilk yükleme için gerekli).
-- (İleride "yalnızca içinde olduğun oda" diye daraltılabilir.)
create policy "read_rooms"  on public.rooms  for select using (true);
create policy "read_slots"  on public.slots  for select using (true);
create policy "read_cards"  on public.cards  for select using (true);
create policy "read_decks"  on public.decks  for select using (true);
-- INSERT/UPDATE/DELETE için politika YOK => anon/auth engellenir,
-- service role bypass ettiği için sunucu yazabilir.
