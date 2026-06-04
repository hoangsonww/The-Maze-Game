# scripts/

Project automation scripts. Most are also exposed via `package.json` scripts and
the root `Makefile`.

```mermaid
flowchart LR
    subgraph dev["Local dev"]
        S1["gen-secret.js<br/>→ JWT secret"]
        S2["check-db.js<br/>→ ping Mongo/PG"]
        S3["seed-leaderboard.js<br/>→ demo rows"]
    end
    subgraph build["Build / CI"]
        B1["build-frontend.js<br/>→ frontend-dist/"]
        B2["export-openapi.js<br/>→ openapi.json"]
        B3["validate-openapi.js<br/>(CI gate)"]
    end
    subgraph ops["Run against a live API"]
        O1["smoke-test.js<br/>→ assert endpoints"]
        O2["clean-leaderboard.js<br/>→ delete by name"]
    end
    B2 --> B3
```

| Script                 | What it does                                                          |
| ---------------------- | --------------------------------------------------------------------- |
| `build-frontend.js`    | Assemble the static site into `frontend-dist/` (used by CI + Docker). |
| `gen-secret.js`        | Print a strong random secret (e.g. for `JWT_SECRET`).                 |
| `check-db.js`          | Ping the configured datastore(s) — Mongo and/or Postgres.             |
| `seed-leaderboard.js`  | Insert random demo leaderboard entries (via the active driver).       |
| `smoke-test.js`        | Hit a running API's public endpoints and assert they respond.         |
| `export-openapi.js`    | Write the OpenAPI spec to `openapi.json`.                             |
| `validate-openapi.js`  | Validate the spec (no broken `$ref`s, every op documented). CI gate.  |
| `clean-leaderboard.js` | Remove leaderboard rows from Mongo by name/prefix.                    |

## Examples

```bash
node scripts/gen-secret.js                       # JWT secret
node scripts/build-frontend.js                   # -> frontend-dist/
MONGODB_URI=... node scripts/check-db.js
MONGODB_URI=... node scripts/seed-leaderboard.js 50
API_BASE=https://maze-game-api.vercel.app node scripts/smoke-test.js
node scripts/export-openapi.js && node scripts/validate-openapi.js
MONGODB_URI=... node scripts/clean-leaderboard.js "E2E_*"
```
