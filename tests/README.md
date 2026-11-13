Run validation checks with `npx tsx tests/admin-regressions.ts`.

Run the database and HTTP regression checks with `npx tsx tests/admin-regressions.ts --database` against the local development database after `npx prisma migrate deploy`. These tests create uniquely identified customer, catalog, order and booking fixtures, then remove those fixtures and their uploaded files. They refuse to run with `NODE_ENV=production`.

Coverage includes expert name/mobile validation, mandatory registration phone numbers, new Google signup completion, cancelled-order visibility, sales-based product ranking, complete service-detail persistence, image/PDF uploads, and attachment authorization.
