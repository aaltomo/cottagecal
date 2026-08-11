# CottageCal

A tiny shared cottage-reservation calendar. Multiple people pick dates in a
month view; overlapping bookings are rejected so two parties can't book the
same days. The cottage is closed off-season (Nov–Mar), so those days can't be
booked.

Optionally gate the whole thing with a shared password: set `COTTAGE_PASSWORD`
(Basic Auth, username ignored). Unset = open, for local dev.

## Run

```sh
node server.js          # http://localhost:3000  (set PORT to change)
```

No dependencies, no build step. Reservations are stored in `reservations.json`
(created on first booking).

## Test

```sh
node test_overlap.js    # checks the booking-conflict rule
node test_holidays.js   # checks the Finnish-holiday computation
```

## API

- `GET /reservations` → list of `{id, name, start, end}`
- `POST /reservations` `{name, start, end}` (dates `YYYY-MM-DD`, inclusive) → 201, or 409 if the range clashes
- `DELETE /reservations/:id` → cancel

## Not included

- No user accounts — reservations are keyed by a typed name, on the honour
  system (the optional `COTTAGE_PASSWORD` above is one shared password, not logins).
- No email/reminders.

Add those when a family cottage outgrows the honour system.
