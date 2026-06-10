-- Payment log table for Razorpay transactions
create table if not exists payment_log (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  pack_id             text not null,
  credits_added       int not null,
  amount_paise        int not null,
  razorpay_order_id   text not null,
  razorpay_payment_id text not null unique,  -- idempotency key
  created_at          timestamptz default now()
);

-- Add lifetime_purchased column to credits if not present
alter table credits add column if not exists lifetime_purchased int default 0;

-- RLS
alter table payment_log enable row level security;

create policy "Users see own payments"
  on payment_log for select
  using (auth.uid() = user_id);

-- Service role bypasses RLS — backend uses service_role key, so inserts work fine.
