# Quorum group project

Quorum is a classroom prototype for conditional group payments. The team is Ethan, Nico, Cody, Colin, and Zenon. Payments, identity, custody, payouts, and refunds are simulated. No real funds move.

## Version included

This export contains the published shared-storage application, version 2, source commit `1544d10eb530cc2333a4251ce7fd3988148b0aa4`, recovered November 17, 2026. It has full-share contributions, automatic release, refunds, transaction receipts, and cross-device shared rooms. **Partial contributions are not in this published version.** That enhancement was drafted separately and was not committed or published before workspace cleanup. Do not present this archive as supporting installments.

The live site was not modified or redeployed to create this ZIP. Source files are preserved except this export README and removal of the live Site project ID from `.openai/hosting.json`, so this copy cannot accidentally target the original project. No Git history, credentials, cloud database contents, room invite links, or local user data are included.

## Save and upload to GitHub

1. Download and extract the ZIP. Open the `Quorum_GitHub_Source` folder.
2. Create a new GitHub repository named `quorum-fintech` (or your preferred name).
3. Upload the contents of this folder, including `.gitignore` and `.openai/hosting.json`, then commit them. Do not upload the ZIP itself as your only repository content.
4. Add the other four members as collaborators in repository settings.

GitHub Desktop is a convenient alternative: create a local repository from this folder and publish it. Check that hidden configuration files were included. Do not commit `node_modules`, `.wrangler`, `.sites-runtime`, `.env` files, or database files.

## Run locally

Install Node.js 24 LTS (at minimum 22.13) and npm, then open a terminal inside this folder:

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_sturdy_the_stranger.sql
npm run dev
```

Open the local URL printed by the terminal (normally port 5173). The migration command initializes a NEW local D1 database. Do not use `--remote`. Apply each migration only once to a given local database. A fresh database is empty; use **Start our shared demo** to create synthetic sample records.

For a built local preview, use `npm start` after the build and migration. It prints its own URL. Developer changes can be tested using `npm run dev`; rebuild after changing database bindings or before using `npm start`.

The packaged execution-profile helper defaults clean checkouts to portable mode on Windows, macOS, and Linux. No ChatGPT tool or plugin is required to run the local commands above.

## Storage and environment

- Local development: Cloudflare's local D1 emulator is used; no Cloudflare login, API key, or live database credentials are required.
- Hosted version: uses Cloudflare Workers and a D1 database bound as `DB`. Hosting provisions this binding in the original Site. For independent hosting you must provision your own Worker/D1 resources and apply the checked-in migration; this ZIP does not connect to the live database.
- Required local environment variables: none for the simulated payment app. Do not supply real payment secrets.
- Sharing across devices requires a single reachable server and shared database. Two separate local installations use separate local databases. A localhost URL works only on the computer running it.
- Updates poll the server about every two seconds while a view is active. The complete room invite link gives access to that demo room. Participant identity is simulated.

## GitHub hosting

GitHub stores and shares the code. GitHub Pages cannot run the dynamic API or D1 backend required for shared rooms. Keep the existing hosted Quorum URL for the class demo, or deploy the backend on compatible hosting separately.

## Source map

- `public/app.js`, `public/style.css`, `lib/quorum-html.ts`: interface and design.
- `lib/quorum-model.js`: payment-state simulation.
- `lib/quorum-service.ts`, `app/api/room/route.ts`: shared room API, validation, and concurrency control.
- `db/schema.ts`, `drizzle/`: database schema and migration.
- `tests/shared.test.ts`, `verify.cjs`: state and shared-service tests.
- `legacy/`, `public/quorum-offline.html`: earlier browser-only demo; it does not synchronize across devices.
- `ORIGINAL_README.md`: original development notes.

## Checks

After installing dependencies:

```sh
node verify.cjs
node --import tsx tests/shared.test.ts
```

These are the checks shipped with this source version. No private demo transactions are included.
