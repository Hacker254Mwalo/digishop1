-- Optional, phone-verified customer accounts. Apply after the base shop schema.
-- Public checkout remains guest-capable; the application server uses the service role
-- only after verifying the Supabase Auth access token and confirmed phone.
begin;

create table if not exists public."customerAccounts" (
  "userId" uuid primary key references auth.users(id) on delete cascade,
  username varchar(24) not null,
  phone varchar(12) not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint customer_accounts_username_format check (username ~ '^[a-z0-9_]{3,24}$'),
  constraint customer_accounts_phone_format check (phone ~ '^254[17][0-9]{8}$')
);

create unique index if not exists customer_accounts_username_ci_unique
  on public."customerAccounts" (lower(username));
create unique index if not exists customer_accounts_phone_unique
  on public."customerAccounts" (phone);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'customer_accounts_username_format'
      and conrelid = 'public."customerAccounts"'::regclass
  ) then
    alter table public."customerAccounts"
      add constraint customer_accounts_username_format check (username ~ '^[a-z0-9_]{3,24}$');
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'customer_accounts_phone_format'
      and conrelid = 'public."customerAccounts"'::regclass
  ) then
    alter table public."customerAccounts"
      add constraint customer_accounts_phone_format check (phone ~ '^254[17][0-9]{8}$');
  end if;
end $$;

alter table public."orderRequests"
  add column if not exists "accountUserId" uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'order_requests_customer_account_fk'
      and conrelid = 'public."orderRequests"'::regclass
  ) then
    alter table public."orderRequests"
      add constraint order_requests_customer_account_fk
      foreign key ("accountUserId")
      references public."customerAccounts"("userId")
      on delete set null;
  end if;
end $$;

create index if not exists order_requests_account_user_idx
  on public."orderRequests" ("accountUserId", "createdAt" desc);

alter table public."customerAccounts" enable row level security;
revoke all on table public."customerAccounts" from anon, authenticated;
grant select, insert, update, delete on table public."customerAccounts" to service_role;

commit;
