-- Hosted schema for Dimi's Lessons.
-- The running app stores the same records in data/lessons.db and enforces
-- the same access rules in server actions. Apply this migration when a
-- Supabase project is connected. Student PIN sessions stay on the server
-- and never receive a database role that can read payments or feedback.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('teacher', 'parent')),
  name text not null,
  email text not null unique,
  phone text not null default '',
  social text not null default '',
  occupation text not null default '',
  currency text not null default 'EUR',
  locale text not null default 'en',
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  kind text not null default 'child' check (kind in ('child', 'adult')),
  subject_default text not null default 'math',
  platform_default text not null default 'paper',
  location_default text not null default 'in_person',
  price_cents integer not null default 0,
  billing_mode text not null default 'per_lesson' check (billing_mode in ('per_lesson', 'prepaid')),
  school text not null default '',
  grade text not null default '',
  interests text not null default '',
  ambitions text not null default '',
  status text not null default 'active',
  student_pin_hash text,
  student_pin_salt text,
  created_at timestamptz not null default now()
);

create table if not exists client_parents (
  client_id uuid not null references clients (id) on delete cascade,
  parent_id uuid not null references profiles (id) on delete cascade,
  primary key (client_id, parent_id)
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  occurred_on date not null,
  subject text not null,
  platform text not null,
  location text not null,
  materials text not null default '',
  homework text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  paid_on date not null,
  amount_cents integer not null,
  lessons_added integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  parent_name text not null,
  parent_email text not null,
  parent_phone text not null default '',
  parent_social text not null default '',
  parent_occupation text not null default '',
  child_name text not null,
  school text not null default '',
  grade text not null default '',
  interests text not null default '',
  ambitions text not null default '',
  subject text not null default 'math',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

create table if not exists feedback_notes (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references profiles (id) on delete cascade,
  client_id uuid references clients (id) on delete cascade,
  lesson_id uuid references lessons (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists feedback_requests (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references profiles (id) on delete cascade,
  client_id uuid references clients (id) on delete cascade,
  teacher_id uuid not null references profiles (id) on delete cascade,
  open_question text not null,
  status text not null default 'open' check (status in ('open', 'answered')),
  pace integer,
  following_score integer,
  homework_score integer,
  overall integer,
  open_answer text not null default '',
  created_at timestamptz not null default now(),
  answered_at timestamptz
);

alter table profiles enable row level security;
alter table clients enable row level security;
alter table client_parents enable row level security;
alter table lessons enable row level security;
alter table payments enable row level security;
alter table registrations enable row level security;
alter table feedback_notes enable row level security;
alter table feedback_requests enable row level security;

create or replace function is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

create or replace function is_parent_of(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from client_parents
    where client_id = target and parent_id = auth.uid()
  );
$$;

create policy "teacher reads profiles" on profiles
  for select using (is_teacher() or id = auth.uid());

create policy "teacher updates own profile" on profiles
  for update using (id = auth.uid());

create policy "teacher manages clients" on clients
  for all using (is_teacher() and teacher_id = auth.uid())
  with check (is_teacher() and teacher_id = auth.uid());

create policy "parent reads own children" on clients
  for select using (is_parent_of(id));

create policy "teacher manages links" on client_parents
  for all using (is_teacher())
  with check (is_teacher());

create policy "parent reads own links" on client_parents
  for select using (parent_id = auth.uid());

create policy "teacher manages lessons" on lessons
  for all using (
    is_teacher() and exists (
      select 1 from clients c where c.id = client_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    is_teacher() and exists (
      select 1 from clients c where c.id = client_id and c.teacher_id = auth.uid()
    )
  );

create policy "parent reads lessons" on lessons
  for select using (is_parent_of(client_id));

create policy "teacher manages payments" on payments
  for all using (
    is_teacher() and exists (
      select 1 from clients c where c.id = client_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    is_teacher() and exists (
      select 1 from clients c where c.id = client_id and c.teacher_id = auth.uid()
    )
  );

create policy "parent reads payments" on payments
  for select using (is_parent_of(client_id));

create policy "anyone can register" on registrations
  for insert with check (status = 'pending');

create policy "teacher reads registrations" on registrations
  for select using (is_teacher());

create policy "teacher updates registrations" on registrations
  for update using (is_teacher());

create policy "parent writes notes" on feedback_notes
  for insert with check (parent_id = auth.uid());

create policy "parent reads own notes" on feedback_notes
  for select using (parent_id = auth.uid() or is_teacher());

create policy "teacher manages requests" on feedback_requests
  for all using (is_teacher() and teacher_id = auth.uid())
  with check (is_teacher() and teacher_id = auth.uid());

create policy "parent reads own requests" on feedback_requests
  for select using (parent_id = auth.uid());

create policy "parent answers own requests" on feedback_requests
  for update using (parent_id = auth.uid() and status = 'open')
  with check (parent_id = auth.uid());

-- Seed the teacher after creating the auth user in Supabase:
-- insert into profiles (id, role, name, email, phone, locale)
-- values ('<auth user uuid>', 'teacher', 'Dimitar', 'dimi@lessons.app', '', 'en');
