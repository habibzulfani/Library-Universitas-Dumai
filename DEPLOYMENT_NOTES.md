# Deployment & Environment Management Notes

## 1. Unified Environment Management
- Use `env.production` as the single source of truth for all environment variables (backend and frontend).
- In `deploy.sh`, after generating `.env` and replacing secrets, sync public variables to the frontend:
  ```bash
  grep '^NEXT_PUBLIC_' .env > frontend/.env
  ```
- Always set `NEXT_PUBLIC_API_URL` in production to your server's public IP or domain.
- For local development, keep your own `frontend/.env` with `NEXT_PUBLIC_API_URL=http://localhost:8080`.

## 2. Next.js Build-Time Safety
- Added a check in `frontend/next.config.js` to throw an error if `NEXT_PUBLIC_API_URL` is not set in production:
  ```js
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_API_URL) {
      throw new Error('NEXT_PUBLIC_API_URL must be set in production!');
  }
  ```

## 3. MySQL Initialization & Seeding
- Place all schema and seed SQL files in the `mysql-init/` directory so they are loaded on first DB creation by Docker Compose.
- Example file order:
  - `01-schema.sql` (from `database_schema.sql`)
  - `02-seed.sql` (from `backend/database/seed.sql`)
  - `03-sample_data.sql` (for demo/test only)
- To reset and re-seed the database:
  ```sh
  docker compose down -v
  ./deploy.sh
  ```

## 4. CSV Import & Admin User
- Ensure your CSV import logic does **not** clear or overwrite the admin user seeded by SQL.
- If needed, always re-insert the admin user after import, or add backend logic to ensure the admin exists.

## 5. Hardcoded localhost:8080
- All frontend and backend code should use environment variables for API URLs, not hardcoded `localhost:8080`.
- The only safe fallback is for local development, e.g.:
  ```js
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  ```
- Always set the correct value in production.

## 6. Troubleshooting Checklist
- If seeded data (like the admin user) is missing after deploy, check:
  - That your schema/seed SQL files are in `mysql-init/`.
  - That you reset the MySQL data volume if needed.
  - That your CSV import does not remove admin users.
- If frontend API calls fail, check:
  - That `NEXT_PUBLIC_API_URL` is set correctly in `frontend/.env`.
  - That the frontend is rebuilt after changing env files.

## 7. Git Merge Conflicts
- If you have local changes and want to keep the remote version:
  ```sh
  git checkout --theirs <file>
  git add <file>
  git commit
  ```

---

**Keep this file updated as you refine your deployment process!** 