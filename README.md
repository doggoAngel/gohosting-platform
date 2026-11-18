# GoHosting: Minecraft server hosting platform

A Minecraft server hosting service I designed and built on my own in about 3 months, and ran in production.
A customer picks a server type, pays with Stripe, and the platform creates a dedicated LXC container on Proxmox, starts Minecraft and exposes it to the Internet automatically.

> **Status:** the service is closed. The code is published as a portfolio project and is not maintained.

## Architecture

```
React frontend ──HTTP/JWT──▶ FastAPI backend ──▶ MongoDB (users, servers, payments)
                                   │
                                   ├──▶ Stripe Checkout (payments, renewals)
                                   ├──▶ Proxmox API (clone LXC template, start/stop/delete)
                                   ├──▶ SSH into the container (start Minecraft in `screen`, @reboot cron)
                                   └──▶ playit.gg (public tunnel for each server)

runtime.py (scheduler, daily): expired servers are stopped until renewal,
servers in the trash for more than a month are deleted for good.
```

## Features

- Registration and login: passwords hashed with **Argon2id**, sessions with **JWT** (with expiry).
- Catalogue of server types; purchase and renewal through **Stripe Checkout**, checked server-side.
- **Automatic provisioning:** clone of an LXC template on Proxmox, static IP, start-up, Minecraft launch over SSH, public tunnel creation.
- Customer dashboard: start/stop of the container and of the Minecraft server, trash and restore, payment history.
- Admin dashboard: users with servers and total spent, all payments and servers.

## Stack

Python · FastAPI · MongoDB (pymongo) · Stripe · Proxmox API (proxmoxer) · Paramiko (SSH) · schedule
Frontend: React · TypeScript · Vite · Tailwind / shadcn-ui

## Running it

```bash
cp .env.example backend/.env      # fill in your values (Stripe TEST key)
cd backend && pip install fastapi uvicorn pymongo stripe proxmoxer paramiko pyjwt argon2-cffi python-dotenv schedule python-dateutil requests
python main-api.py        # API (uvicorn started from the script)
python runtime.py         # scheduler for expiries and the trash
cd ../frontend && npm install && npm run dev
```

You need a Proxmox node with an LXC template ready for Minecraft and a MongoDB instance.

## Known issues

I'm a penetration tester, and I reread my own code a year later. Here is what I'd fix:

- **Payment confirmation (`/api/success`):** the endpoint doesn't check that the session belongs to the user and doesn't block reuse of the same `session_id` (one payment → several servers). The right fix is to tie the session to the user and use the Stripe **webhook** (`checkout.session.completed`) with idempotency.
- **Admin:** some actions in the users table (view, block, reset, delete) exist only in the interface and have no backend logic behind them.
- **MongoDB:** the handling of the identifier key needs revisiting.
- **playit.gg tunnels (`tunnel.py`):** when I built the platform playit.gg had no public API, so I automated the web interface directly: login, CSRF token extraction, and requests that create and delete tunnels. playit.gg has since redesigned the site and published official APIs, so this part **no longer works** as is.
- SSH as `root` with a password and `verify_ssl=False` toward Proxmox: SSH keys and a valid certificate would be better.

## Fixed after self-review

- **Unpaid sessions treated as paid (`/api/success`):** the `payment_status != 'paid'` check logged the failed payment but didn't stop the flow (a `return` was missing), so a user could get or renew a server without paying by calling the endpoint with the `session_id` of an abandoned checkout. Fixed: the flow now stops with `402 Payment Required`.

## How I'd rebuild it today

- A modular structure: one FastAPI `APIRouter` per area (`servers`, `payments`, `users`, `admin`), logic in a separate services layer (`services/proxmox.py`, `services/billing.py`, `services/provisioning.py`).
- Authentication and admin role handled once with `Depends(...)`, instead of decoding the JWT again in every endpoint.
- Tunnels through the official playit.gg APIs instead of automating the web interface.
- Pydantic models for requests and responses, automated tests on the services, Docker Compose (API + MongoDB + scheduler).
