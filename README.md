# Habit tracker

A single-page web app for logging multi-checkpoint habits, capturing focus to-dos, and reviewing streaks at a glance.

## Highlights

- 🔐 **Supabase-backed accounts:** Authentication, password changes, and data sync run through the hosted Supabase project so any device signed in with your account loads the same tracker instantly.
- 🔄 **Realtime sync:** Habit updates push to Supabase immediately and live changes stream over websockets, so logging on your phone updates the browser (and vice versa) within moments—no manual refresh button required.
- 📡 **Self-broadcasting updates:** Each sync emits a lightweight realtime ping so other signed-in devices refresh even if Postgres change events are slow to arrive.
- 🚨 **Out-of-sync indicator:** If the app can’t reach Supabase, a subtle warning appears in the header—click it anytime to retry a cloud pull.
- 🗓️ **Per-habit heatmaps:** Dense GitHub-style grids that flex per habit—weekly rows summarize a whole week while month and year layouts track individual days.
- 🔁 **Customizable range:** Tap a habit label to pick a 7-day week, weekly goal grid, month, or year and the calendar instantly reflows with the right column count and cell size.
- 🎯 **Weekly goals:** Give weekly cells their own target (e.g., 3 gym visits) so the tint reflects how close you came to that goal.
- ✅ **Focus to-dos:** Add lightweight tasks beside the heatmap and mark them complete for a celebratory burst animation.
- 🧩 **Multi-checkpoint habits:** Define sub-habits (e.g., the five daily prayers or three meals) with the in-app builder and track each checkpoint from the daily list.
- 🔍 **Quick logging:** Search a habit by name and hit enter to instantly log it for the selected day.
- 📚 **Habit library:** Edit colors, manage checkpoints, archive habits without losing history, and browse archived habits from a dedicated tab.
- 🗑️ **Safe deletion:** Remove habits and their historical data when they no longer serve you.
- 🎨 **Color-tuned heatmaps:** Each habit row renders with its own shade so completions reflect the color you picked in the library.
- ↕️ **Drag-to-reorder heatmaps:** Grab the move handle beside each habit name to reshuffle rows whenever priorities change.
- ✨ **Selectable-day glow:** The chosen day stays in sync across every view, gently fading after 10 seconds until you log again or pick a new date.
- 🧭 **Daily checkpoint list:** Smash the glowing “Log habit” button to finish the day, or tick sub-habits individually for precision—now with a sidebar calendar to jump between dates.
- 👤 **Quick account controls:** Hover the account chip to reveal your email, then open the menu to change your password or delete the account when it’s time to start fresh.

All information lives per-account in Supabase—no tracker data is stored in local storage. The app is preconfigured to use the hosted project at `https://peuiedofnbmjodoeiknk.supabase.co`, so progress follows you automatically across devices once you sign in.

## Getting started

1. Clone or download this repository.
2. Open `index.html` in a modern browser. (For the best experience, serve it via a simple static server.)
3. Sign in with an existing Supabase account to load your tracker (accounts must already exist in the hosted project).
4. Build habits from the library panel and start logging checkpoints from the daily list.

## Supabase schema

The bundled Supabase project expects the following tables and Row Level Security policies. If you are recreating the schema, run these statements in the SQL editor before using the tracker:

1. Create a Supabase project and enable the REST API.
2. In the SQL editor, create an **accounts table** (default name: `tracker_accounts`) that links each row to the authenticated user:

   ```sql
   create table if not exists public.tracker_accounts (
     user_id uuid primary key references auth.users(id) on delete cascade,
     email text not null,
     password_hash text not null,
     sync_settings jsonb default '{}'::jsonb,
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );
   ```

3. Create a **profiles table** (default name: `tracker_profiles`) that stores the habit data per account:

   ```sql
   create table if not exists public.tracker_profiles (
     user_id uuid primary key references auth.users(id) on delete cascade,
     data jsonb default '{}'::jsonb,
     updated_at timestamptz default now()
   );
   ```

4. Enable Row Level Security on both tables and allow the authenticated user to manage only their own rows:

   ```sql
   alter table public.tracker_accounts enable row level security;
   alter table public.tracker_profiles enable row level security;

   create policy "Users can manage their account row"
     on public.tracker_accounts
     for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);

   create policy "Users can manage their profile row"
     on public.tracker_profiles
     for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);
   ```

5. (Optional) Disable email confirmations in Supabase Auth if you want new accounts to be usable immediately, or confirm the email address before signing in.

> ℹ️ The tracker still listens for Supabase Postgres change feeds. Toggle **Realtime** for both tables (or run `alter publication supabase_realtime add table public.tracker_accounts;` and `alter publication supabase_realtime add table public.tracker_profiles;`) if you want database-originated events alongside the built-in client broadcasts.

Because the app no longer exposes a registration flow, create accounts directly through the Supabase dashboard, Auth API, or another administrative surface before signing in.

The tracker relies entirely on Supabase; if a pull fails you’ll see the out-of-sync indicator and can retry a cloud refresh.

## Account menu

- Hover the account chip in the header to preview the signed-in email.
- Click the chip to open the account menu, change your password, or delete the account and all associated Supabase data.

## Keyboard and mouse tips

- **Click** any sub-habit chip to toggle that checkpoint without affecting the others.
- **Click** any heatmap cell to focus that date or week—log completions from the daily checklist or quick search.
- **Enter** while in the search box toggles the first matching habit for the selected day.
- **Enter** inside the to-do input quickly adds a new focus task.
- **Click a habit label** above the heatmap to switch between week, month, and year layouts, then adjust the weekly goal when relevant.
- **Drag** the move handle next to a habit name to rearrange heatmap rows.

## Resetting the tracker

Press the **Reset data** button beneath the habit library to clear all saved habits, entries, and to-dos for the signed-in account. The change is pushed to Supabase immediately so every device sees the reset.

## Tech stack

- Vanilla HTML, CSS, and JavaScript
- CSS glassmorphism styling with celebratory bursts for quick wins
- No build tools or frameworks required

Feel free to adapt the visuals or extend the focus workflow to match your own ritual.
