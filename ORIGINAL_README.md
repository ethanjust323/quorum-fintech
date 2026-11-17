# Quorum shared group-payments prototype

This BFIN 4260 classroom demo uses a shared D1 database. Ethan, Nico, Cody, Colin, and Zenon can use separate devices to view the same pool, contribute, and see automatic release or refund updates.

## Using the demo

Open the published site, choose **Start our shared demo**, and send the complete **Invite group** link to the other four members. Everyone opens that same link and chooses their name under **Act as a participant**. The seeded booking is $500, split into five $100 shares. Active views refresh from the server every two seconds. Reopening or returning to a tab refreshes it too. Refreshing the page preserves shared records.

The fifth contribution automatically releases the simulated $500. Restart resets the pool for everyone. With only some participants paid, advancing the shared demo clock initiates refunds; completing refunds simulates partner settlement.

## Real and simulated

Working: persistent shared rooms, exact-cent allocations, server-side validation, atomic updates, duplicate-payment prevention, idempotent operation IDs, scenario-generation validation, automatic outcomes, transaction history, receipts, cloud persistence and cross-device updates.

Simulated: participant identity, fund collection, partner custody, release, refunds and workshop time. No real money or payment credentials. Anyone holding a room invite can act as any demo participant or use workshop controls. These are demo capabilities, not account-based payment authentication. Invite tokens are generated with 256-bit browser randomness, sent in an Authorization header, and stored on the server only as SHA-256 room identifiers. Public requests cannot enumerate rooms or change an unknown room.

The app checks deadlines on server reads/writes. A production system would need a durable scheduler, real authentication, payment callbacks, reconciliation, disputes, chargebacks, compliance and a qualified partner. Prices remain untested; prototype fees are zero.

## Previous local version

Prior browser-only pools are not uploaded or overwritten. They remain in browser storage under the old key. `legacy/` and `public/quorum-offline.html` preserve the prior offline version; offline files do not synchronize.

## Development and checks

Use Sites build and publishing helpers. Database schema is in `db/schema.ts`; the schema-only Drizzle migration is checked in under `drizzle/`.

- `node verify.cjs`: original payment-state invariants.
- `node --import tsx tests/shared.test.ts`: SQLite-backed service tests for five simultaneous contributions, compare-and-swap retries, single release, duplicate prevention, retry idempotency, room authorization/isolation, stale reset rejection and shared refunds.
- Browser QA: two independent page instances in one shared room, bidirectional contribution updates without manual refresh.

Room content is stored server-side. Local storage holds only the last room invite and participant preference; it is no longer the source of pool state.
