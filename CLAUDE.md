# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Run the app: `node server.js` (serves http://localhost:3000; `PORT` env var overrides).
- Test: `node test_overlap.js` (booking-conflict rule) and `node test_holidays.js`
  (Easter computus + derived Finnish holidays). Each prints `ok` on success.

There is no build step, no package manager, and no dependencies — plain Node stdlib.

## Architecture

CottageCal is a shared cottage-reservation calendar, no build step, plain Node stdlib:

- `server.js` — Node stdlib `http` server. Serves `index.html` at `/` and a JSON API for
  reservations (`GET`/`POST /reservations`, `DELETE /reservations/:id`). Storage is the whole
  reservation list read from / written to `reservations.json` on every request (no DB, no
  in-memory cache). A reservation is `{id, name, start, end}` where dates are inclusive
  `YYYY-MM-DD` strings; `id` is `start_end_name`. `server.listen` is guarded by
  `require.main === module`, so `require('./server')` (the tests) loads the handlers without
  binding a port — don't remove that guard.
- `index.html` — the entire frontend (HTML + CSS + vanilla JS, no framework). Renders a
  Monday-first grid showing **two months side by side** (`monthCard` builds one panel; `render`
  draws `view` and `view+1`) so a range can cross a month boundary without navigating. The user
  clicks a start date then an end date (`pickDay`) to select an inclusive range, then POSTs it —
  a pure two-click model with no cursor/hover tracking (tap start again, or outside the grid, to
  cancel), so it behaves the same on mouse and touch. Booked days show the reserver's name in a
  per-name colour; Finnish public holidays are marked red (name on hover); weekends are shaded.
- `holidays.js` — dual-use module (`<script src>` in the browser, `require()` in the test) that
  computes Finnish public holidays for a year. Fixed dates plus Easter-derived ones via the
  Computus algorithm, so it works for any year with no data table. Served by `server.js` at
  `/holidays.js`. The client keys holidays with its own `iso()` so they line up with the grid.
- `test_overlap.js` / `test_holidays.js` — self-checks for the two pieces of non-trivial logic.

Two rules are enforced server-side on every POST (both return 409); the client only *hints*
by disabling the affected days, and must never be trusted to enforce them:

1. **No two reservations may overlap** — `overlaps(a, b) => a.start <= b.end && a.end >= b.start`.
2. **Off-season is closed Nov–Mar** — `rangeHasClosedDay(start, end)` walks the range and rejects
   it if any day falls in months 11,12,1,2,3 (so ranges that merely *cross* into the closed
   season are caught too). The client mirrors the rule in `monthCard` (`closed` flag) to grey
   those months out — keep the two definitions in sync if the season ever changes.

Both live in one place each in `server.js`. Keep these checks server-side.

## Auth & config

Optional shared-password Basic Auth. Set `COTTAGE_PASSWORD` to gate the whole server (page +
API); leave it unset for open local dev (startup logs a warning). Username is ignored; the
password is compared with `crypto.timingSafeEqual`. `DATA_FILE` overrides where
`reservations.json` lives (e.g. a mounted volume in production).

## Deployment

Deployed on Fly.io (app `cottagecal`, region `arn`) via the `Dockerfile` — `fly deploy` builds
and ships it; no CI. Config in `fly.toml`: listens on `8080`, `DATA_FILE=/data/reservations.json`
on a mounted volume named `data` so bookings survive redeploys. `COTTAGE_PASSWORD` is a Fly secret
(`fly secrets set`), never in `fly.toml`. Machines scale to zero when idle — keep the count at
**one**; a second machine gets its own volume and would split the reservation data.

## Deliberate omissions

Beyond the shared password there are no user accounts (reservations are keyed by a typed name),
no persistence layer beyond the JSON file, no email/reminders. These are honour-system tradeoffs
for a family cottage, not oversights — see README. Don't add them speculatively.
