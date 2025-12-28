-- Enable PostGIS if needed (optional for basic lat/lng but good for distance)
create extension if not exists postgis;

-- RESTAURANTS
create table restaurants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  address text,
  lat double precision,
  lng double precision,
  phone text,
  category text not null, -- pizza, burger, sushi, cafe, bar, etc
  icon text, -- emoji or icon name
  hero_image_url text,
  opening_hours_json jsonb,
  is_active boolean default true,
  is_featured boolean default false,
  created_at timestamptz default now()
);

-- RESTAURANT CONTACTS (Phone numbers authorized to post)
create table restaurant_contacts (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references restaurants(id) on delete cascade,
  contact_name text,
  phone_e164 text not null unique, -- +1234567890
  verified boolean default false,
  created_at timestamptz default now()
);

-- SPECIALS
create table specials (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references restaurants(id) on delete cascade,
  title text not null, -- The main line (e.g. "$10 Margaritas")
  description text, -- Additional info
  start_time timestamptz, -- Specific timestamp for "today"
  end_time timestamptz, -- Specific timestamp for "today"
  date_local date default current_date, -- The date this special applies to
  is_active boolean default true,
  source text default 'sms', -- sms, web, admin
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- INBOUND MESSAGES (Log)
create table inbound_messages (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references restaurants(id) on delete set null,
  from_phone text not null,
  body text,
  parsed_ok boolean default false,
  parse_error text,
  created_at timestamptz default now()
);

-- EVENTS / ANALYTICS
create table events (
  id uuid default gen_random_uuid() primary key,
  type text not null, -- view, click_directions, click_call
  restaurant_id uuid references restaurants(id) on delete set null,
  special_id uuid references specials(id) on delete set null,
  created_at timestamptz default now()
);

-- INDEXES
create index idx_restaurants_slug on restaurants(slug);
create index idx_specials_date_local on specials(date_local);
create index idx_restaurant_contacts_phone on restaurant_contacts(phone_e164);
