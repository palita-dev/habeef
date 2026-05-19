# Repo notes for AI coding agents

Purpose: help an AI agent be immediately productive in this codebase by documenting architecture, runtime workflows, and common code patterns.

Big picture
- Frontend: static HTML pages at project root (e.g. `index.html`, `admin.html`, `owner.html`) and client JS under `js/` (notably `js/app.js`, `js/auth.js`, `js/cart.js`).
- Backend/API: PHP endpoints live in `api/` (each file returns JSON). The DB connection is in `api/db.php`.
- DB/schema: SQL dumps are in the repo root (for example `appvizac_habeefnoodle_18.5.2569.sql`, `update_db.sql`).
- Optional Node helper: `index.js` is a tiny Express app (listens on port 4000); a VS Code task exists (`npm: dev`) but there is no `package.json` in the repo.

How the pieces communicate
- Client code derives a base origin using `SERVER_BASE` (see `js/auth.js`) and calls endpoints like `fetch(SERVER_BASE + '/api/menus.php')`.
- Most API endpoints accept an `action` query parameter (e.g. `api/ingredients.php?action=get_formula`) and return JSON.
- Cart and session-like state are server-backed: the client loads per-table cart with `api/cart.php?table_id=...` and treats that as single source of truth.

Project-specific patterns & conventions
- `SERVER_BASE` is computed at runtime (see `js/auth.js`) — do not hardcode full origins when adding new frontend calls.
- Client uses window/global caches (e.g. `window.FORMULA`, `MENU_ITEMS`) and localStorage/sessionStorage keys: `habeef_current_table`, `habeef_q_param`, `habeef_guest_id`.
- Table QR encoding: `js/app.js` uses a salt `SECRET_SALT = 'habeef_secret_2024'` with base64 encoding (`encodeTableId`/`decodeTableId`). Keep this in mind when changing QR/table logic.
- Polling/sync: frontend periodically refreshes menu and cart (see `setInterval` usage in `js/app.js`) — avoid breaking these implicit refresh expectations.

Developer workflows (discoverable)
- PHP/API: run under Apache+PHP (XAMPP) serving the repo path (this project appears placed at `c:\xampp\htdocs\system\webapp`). Verify requests are same-origin with the HTML pages.
- Node helper: run `node index.js` to start the tiny Express server (port 4000). The included VS Code `npm: dev` task calls `nodemon index.js`; there is no `package.json` so either run `node index.js` or add a `package.json` + `nodemon` if you want hot reload.

Integration & sensitive files
- `api/db.php` contains database host/user/password and chooses dev vs prod credentials by checking `$_SERVER` values. Treat it as a sensitive file — avoid leaking secrets.
- Use the SQL files in the root to inspect or recreate schema: `appvizac_habeefnoodle_18.5.2569.sql`, `update_db.sql`.

Quick examples (real repo references)
- Server base: see `js/auth.js` for `SERVER_BASE` computation.
- API call example: `fetch(SERVER_BASE + '/api/ingredients.php?action=get_formula')` (used from `js/app.js` and `js/owner.js`).
- DB connection: see `api/db.php` (sets `utf8mb4` and uses `mysqli`).

When editing code
- Frontend JS expects JSON responses; return arrays/objects consistent with existing endpoints to avoid breaking many callers.
- Keep `SERVER_BASE`-derived paths unless you intentionally change server origin behavior.
- If you modify API shapes, update all callers under `js/` and test pages: `index.html`, `admin.html`, `owner.html`, `staff.html`.

What I could not infer automatically
- Exact developer start script for the PHP stack (assume XAMPP/Apache). If you use a different HTTP server, provide the exact local URL pattern.
- Any CI hooks or tests (none found).

Questions for the repo owner
- Do you want the Node `index.js` to be part of the dev workflow? Should I add a simple `package.json` and `npm` scripts?
- Confirm preferred local dev URL (XAMPP default likely `http://localhost/system/webapp`), or provide the canonical dev URL to include here.

If anything above is incorrect or you want more detail (API contract summaries, common request/response shapes, or a small `package.json`), tell me which part to expand.
