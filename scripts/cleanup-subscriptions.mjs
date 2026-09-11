import { createClient } from '@libsql/client';

const dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'libsql://estudesk-db-drhimam.aws-us-east-2.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg4Mzk0NDIsImlkIjoiMDFhMDdmMjEtYjMwMS03MTdiLWIxN2EtYjRiMDA2YzE4OTdkIiwia2lkIjoibjFNOXo0Znp1LVdfU004R2xVWUpBbnRGUWp2aWwzNlBDVXQxTW95cXYzZyIsInJpZCI6IjhjM2Y3ZmVlLWVjZDItNDE1MC04MWNmLTFkNzlhMDdmNTk4MSJ9.S57kd_O_QEXq9nCf9O1GqJBf029pqppKx2sQA3gV0bVVruKAW0uTHeImwgdjm9eC14nvVXLf3Q9gvOOCr4TWBA';

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

async function main() {
  console.log(`\n======================================================`);
  console.log(`🧹 eStudesk Subscription Table Deduplication & Indexer`);
  console.log(`======================================================`);

  // 1. Fetch all subscription rows
  const subs = await client.execute(`SELECT id, user_id, plan_id, status, created_at FROM subscriptions ORDER BY created_at DESC`);
  console.log(`Current total subscription rows: ${subs.rows.length}`);

  // Group by user_id
  const userSubsMap = new Map();
  for (const row of subs.rows) {
    const uid = row.user_id;
    if (!userSubsMap.has(uid)) {
      userSubsMap.set(uid, []);
    }
    userSubsMap.get(uid).push(row);
  }

  console.log(`Distinct users with subscriptions: ${userSubsMap.size}`);

  let deletedCount = 0;
  for (const [userId, userRows] of userSubsMap.entries()) {
    if (userRows.length > 1) {
      console.log(`\nUser ${userId} has ${userRows.length} subscription records. Keeping the newest...`);
      // Keep the first (newest due to ORDER BY created_at DESC)
      const keep = userRows[0];
      const toDelete = userRows.slice(1);

      console.log(`  -> Keeping ID: ${keep.id} (Plan: ${keep.plan_id}, Status: ${keep.status})`);
      for (const d of toDelete) {
        console.log(`  -> Deleting duplicate ID: ${d.id} (Plan: ${d.plan_id})`);
        await client.execute({
          sql: `DELETE FROM subscriptions WHERE id = ?`,
          args: [d.id],
        });
        deletedCount++;
      }
    }
  }

  console.log(`\nDeleted ${deletedCount} redundant duplicate subscription records.`);

  // 2. Create Unique Index on user_id so future duplicates can never occur
  try {
    console.log(`Applying UNIQUE INDEX on subscriptions(user_id)...`);
    await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_unique ON subscriptions(user_id)`);
    console.log(`✅ UNIQUE INDEX applied successfully!`);
  } catch (err) {
    console.warn(`Note on unique index:`, err.message);
  }

  // 3. Final verification
  const finalSubs = await client.execute(`SELECT id, user_id, plan_id, status, created_at FROM subscriptions`);
  console.log(`\nFinal subscriptions table state (${finalSubs.rows.length} rows):`);
  console.table(finalSubs.rows);

  console.log(`\n🎉 Subscriptions table successfully simplified to strict 1:1 user model!\n`);
}

main().catch((err) => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
