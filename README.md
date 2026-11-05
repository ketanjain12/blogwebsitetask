# BlogSpace — React + Tailwind + Express + MySQL

This is a full-stack blogging app with User and Admin areas, six demo ad placements, JWT authentication, CRUD for posts/users, and automatic MySQL table creation at API startup.

> The attached brief lists MongoDB; this implementation uses MySQL as requested.

## Local setup
1. Create an empty MySQL database named `blogspace`.
2. `cd backend && cp .env.example .env`, fill database values and a strong JWT secret.
3. `npm install && npm run dev` (tables and demo data are created automatically).
4. In another terminal: `cd frontend && cp .env.example .env && npm install && npm run dev`.

Default local admin: `admin@blogspace.local` / `ChangeMe_Admin_123!` (change before production).

## Railway
- Create MySQL service.
- Create backend service from GitHub repo; Root Directory `/backend`.
- Variables: `NODE_ENV=production`, `DB_HOST=${{MySQL.MYSQLHOST}}`, `DB_PORT=${{MySQL.MYSQLPORT}}`, `DB_USER=${{MySQL.MYSQLUSER}}`, `DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}`, `DB_NAME=${{MySQL.MYSQLDATABASE}}`, `JWT_SECRET=<long-random-secret>`, `JWT_EXPIRES_IN=7d`, `ADMIN_EMAIL=<your-admin-email>`, `ADMIN_PASSWORD=<strong-password>`, `CLIENT_URL=https://your-app.vercel.app`.
- Generate a Railway public domain for the API. Keep MySQL private; no TCP Proxy needed.
- Health endpoint: `/api/health`.

## Vercel
- Import repository, Root Directory `frontend`, preset Vite.
- Build: `npm run build`; Output: `dist`.
- Environment variable: `VITE_API_URL=https://YOUR-RAILWAY-DOMAIN/api`.
- Deploy, then set Railway `CLIENT_URL` to the exact Vercel domain and redeploy backend.

## API
Auth: POST `/api/auth/register`, POST `/api/auth/login`, GET `/api/auth/me`.
Posts: GET `/api/posts`, GET `/api/posts/:slug`.
Ads: GET `/api/ads`.
Admin (JWT + admin role): GET `/api/admin/stats`, CRUD `/api/admin/posts`, GET/PUT/DELETE `/api/admin/users`.

Ads are dummy placeholders, not live Google ads. Configure approved Google Publisher Tag inventory separately before monetizing.
