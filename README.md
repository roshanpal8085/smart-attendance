# Smart College Attendance System

> An IoT-assisted, BLE-beacon-enabled attendance tracking platform for colleges — built with FastAPI, Next.js, and React Native.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Full Setup](#full-setup)
   - [Backend (FastAPI)](#backend-fastapi)
   - [Admin Web (Next.js)](#admin-web-nextjs)
   - [Mobile App (React Native)](#mobile-app-react-native)
6. [Environment Configuration](#environment-configuration)
7. [API Documentation](#api-documentation)
8. [Running Tests](#running-tests)
9. [BLE Beacon Setup](#ble-beacon-setup)
10. [Production Deployment](#production-deployment)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

The **Smart College Attendance System** automates classroom attendance using:

- **BLE Beacons (Mode A)** — fixed beacons in classrooms; student mobile app detects proximity.
- **Teacher Phone (Mode B)** — teacher's phone acts as a temporary BLE broadcaster.
- **Admin Dashboard** — web interface for college admins to manage users, classrooms, subjects, timetables, and reports.
- **REST API** — FastAPI backend with PostgreSQL persistence, Redis session cache, and JWT authentication.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        Client Layer                                │
│                                                                    │
│   ┌──────────────────┐          ┌──────────────────────────────┐  │
│   │  Admin Web       │          │  Mobile App (React Native)   │  │
│   │  (Next.js :3000) │          │  iOS / Android               │  │
│   └────────┬─────────┘          └──────────────┬───────────────┘  │
│            │ HTTPS/REST                         │ HTTPS/REST + WS  │
└────────────┼─────────────────────────────────── ┼──────────────────┘
             │                                    │
┌────────────▼────────────────────────────────────▼──────────────────┐
│                      FastAPI Backend (:8000)                        │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Auth /JWT  │  │  Attendance  │  │  WebSocket   │              │
│  │  Router     │  │  Router      │  │  Live Events │              │
│  └─────────────┘  └──────────────┘  └──────────────┘              │
│                                                                     │
│  ┌────────────────────────┐  ┌──────────────────────┐             │
│  │  PostgreSQL 16         │  │  Redis 7             │             │
│  │  (attendance_db)       │  │  (sessions / cache)  │             │
│  └────────────────────────┘  └──────────────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
             │
┌────────────▼─────────────────────────────────────────────────────┐
│                    Physical Layer (BLE)                            │
│                                                                    │
│   [Mode A]  Fixed BLE Beacons in classrooms                       │
│   [Mode B]  Teacher's phone broadcasts BLE advertisement          │
└────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

| Tool | Minimum version | Install |
|------|----------------|---------|
| Docker + Docker Compose | 24.x / v2 | https://docs.docker.com/get-docker/ |
| Node.js | 20 LTS | https://nodejs.org |
| Python | 3.12 | https://python.org |
| Xcode (iOS only) | 15+ | Mac App Store |
| Android Studio (Android) | Hedgehog+ | https://developer.android.com/studio |
| `watchman` | latest | `brew install watchman` |

---

## Quick Start

```bash
# 1. Clone and configure
git clone https://github.com/your-org/smart-attendance.git
cd smart-attendance
cp .env.example .env          # edit passwords and secrets

# 2. Launch the full stack
docker compose up -d

# 3. Seed demo data
make seed
```

The system will be available at:
- **API** → http://localhost:8000
- **API Docs** → http://localhost:8000/docs
- **Admin Web** → http://localhost:3000

---

## Full Setup

### Backend (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
alembic upgrade head

# Start dev server (hot-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **Tip:** Set `DATABASE_URL` in your `.env` to point to `localhost:5432` when running the backend outside Docker but with Docker Compose providing the database.

### Admin Web (Next.js)

```bash
cd apps/admin-web

npm install
npm run dev        # http://localhost:3000
```

### Mobile App (React Native)

```bash
cd apps/mobile

cp .env.example .env     # adjust API_BASE_URL if needed

npm install

# iOS
npx pod-install          # requires Xcode / CocoaPods
npx react-native run-ios

# Android (emulator or device)
npx react-native run-android
```

> **Note:** For Android emulators, `10.0.2.2` maps to your host machine's `localhost`. The `.env.example` is pre-configured for this.

---

## Environment Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_ENV` | `development` / `production` / `test` | `development` |
| `DATABASE_URL` | Full PostgreSQL connection string | see `.env.example` |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379/0` |
| `JWT_SECRET_KEY` | HS256 signing secret — **change in production** | placeholder |
| `JWT_ACCESS_TOKEN_MINUTES` | Access token lifetime (minutes) | `30` |
| `JWT_REFRESH_TOKEN_DAYS` | Refresh token lifetime (days) | `7` |
| `ATTENDANCE_SESSION_DURATION_SECONDS` | Grace window after session start | `120` |
| `PRESENCE_WINDOW_REQUIRED_SECONDS` | Minimum BLE presence for valid mark | `900` |
| `BLE_RSSI_THRESHOLD` | Minimum RSSI for valid detection | `-80` |
| `CORS_ORIGINS` | JSON array of allowed origins | `["http://localhost:3000"]` |
| `NEXT_PUBLIC_API_URL` | Admin web → API base URL | `http://localhost:8000` |

---

## API Documentation

The FastAPI backend ships with auto-generated interactive docs:

| Interface | URL |
|-----------|-----|
| **Swagger UI** | http://localhost:8000/docs |
| **ReDoc** | http://localhost:8000/redoc |
| **OpenAPI JSON** | http://localhost:8000/openapi.json |

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/login` | Obtain JWT pair |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/attendance/sessions` | List active sessions |
| `POST` | `/attendance/sessions` | Start a session (teacher) |
| `POST` | `/attendance/mark` | Mark presence (student mobile) |
| `GET` | `/reports/daily` | Daily attendance report |

---

## Running Tests

```bash
# Backend (pytest)
make test-backend

# Or locally:
cd backend
python -m pytest tests/ -v --tb=short

# Admin Web
make test-web

# Or locally:
cd apps/admin-web
npm test
```

CI runs automatically on every push/PR to `main` and `develop` via GitHub Actions.

---

## BLE Beacon Setup

### Mode A — Fixed Beacon (iBeacon / Eddystone)

Fixed hardware beacons are installed permanently in classrooms.

1. **Register the beacon** in the admin dashboard under *Classrooms → Beacons*.
2. Configure the beacon with:
   - **UUID**: the UUID shown in the dashboard (e.g. `f47ac10b-58cc-4372-a567-0e02b2c3d479`)
   - **Major**: department code (numeric)
   - **Minor**: classroom number (numeric)
   - **TX Power**: calibrated at 1 m (typically `–59 dBm`)
3. Set the classroom detection mode to **`beacon`** in the admin panel.
4. The student mobile app will scan continuously and record RSSI against the registered UUID.

> **Tip:** Mount beacons at 2–3 m height, centred on the room, away from metal surfaces and large displays to minimise multipath interference.

### Mode B — Teacher Phone

Used where hardware beacons aren't available.

1. Set the classroom detection mode to **`teacher_phone`** in the admin panel.
2. When a teacher starts a session, the **mobile app automatically begins BLE advertising** using the class-specific UUID.
3. Student phones detect the advertisement and push presence events to the API.
4. Advertising stops automatically when the teacher ends the session.

> **Note:** BLE advertising in the background requires specific permissions on both iOS (`bluetooth-peripheral`) and Android (`BLUETOOTH_ADVERTISE`). The app will prompt for these on first use.

---

## Production Deployment

### Checklist

- [ ] Generate a strong `JWT_SECRET_KEY`: `openssl rand -hex 32`
- [ ] Set `POSTGRES_PASSWORD` to a strong random value
- [ ] Set `APP_ENV=production`
- [ ] Configure `CORS_ORIGINS` to your actual domain(s)
- [ ] Enable TLS/HTTPS (via Nginx reverse proxy or cloud load balancer)
- [ ] Configure automated database backups
- [ ] Set up log aggregation (e.g. Loki, CloudWatch)

### Nginx Reverse Proxy (example)

```nginx
server {
    listen 443 ssl;
    server_name attendance.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/attendance.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/attendance.yourdomain.com/privkey.pem;

    location /api/ {
        proxy_pass         http://localhost:8000/;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

### Scaling

```bash
# Scale backend workers horizontally
docker compose up -d --scale backend=3
```

Use an Nginx upstream block or a cloud load balancer to distribute traffic across replicas.

---

## Troubleshooting

### `connection refused` to PostgreSQL

Ensure the `postgres` container is healthy before starting the backend:

```bash
docker compose ps          # check STATUS column
docker compose logs postgres
```

### Alembic migration fails

```bash
# Check current revision
docker compose exec backend alembic current

# Generate a new migration if models changed
docker compose exec backend alembic revision --autogenerate -m "describe change"
docker compose exec backend alembic upgrade head
```

### BLE scanning not working on iOS

- Go to **Settings → Privacy → Bluetooth** and ensure the app has permission.
- Background BLE scanning requires the `UIBackgroundModes` key in `Info.plist`:
  ```xml
  <key>UIBackgroundModes</key>
  <array>
    <string>bluetooth-central</string>
    <string>bluetooth-peripheral</string>
  </array>
  ```

### BLE scanning not working on Android

- Ensure **Location permission** is granted (required for BLE on Android < 12).
- On Android 12+, grant `BLUETOOTH_SCAN` and `BLUETOOTH_ADVERTISE` permissions.
- Disable battery optimisation for the app: **Settings → Battery → App battery usage**.

### Admin web shows `API unreachable`

Confirm `NEXT_PUBLIC_API_URL` in `.env` matches the backend address. When running both inside Docker Compose, use the service name (`http://backend:8000`) for server-side requests and `http://localhost:8000` for browser-side requests.

### Docker build fails (node_modules platform mismatch)

```bash
# Remove cached layers and rebuild
docker compose build --no-cache admin-web
```

---

## Makefile Reference

| Command | Description |
|---------|-------------|
| `make up` | Start all services (detached) |
| `make down` | Stop and remove containers |
| `make logs` | Tail logs for all services |
| `make build` | Rebuild images without cache |
| `make migrate` | Run Alembic migrations |
| `make seed` | Seed demo data |
| `make test-backend` | Run pytest suite |
| `make test-web` | Run Next.js tests |
| `make shell-db` | Open psql in postgres container |

---

## Contributing

1. Fork the repository and create a feature branch from `develop`.
2. Follow the existing code style (Black + isort for Python, ESLint + Prettier for JS/TS).
3. Write tests for new functionality.
4. Open a Pull Request against `develop` — CI must pass before review.

---

## License

MIT © Demo University / Smart Attendance Project
