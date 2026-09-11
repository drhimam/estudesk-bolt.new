import { createClient } from '@libsql/client';

const dbUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'libsql://estudesk-db-drhimam.aws-us-east-2.turso.io';
const authToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg4Mzk0NDIsImlkIjoiMDFhMDdmMjEtYjMwMS03MTdiLWIxN2EtYjRiMDA2YzE4OTdkIiwia2lkIjoibjFNOXo0Znp1LVdfU004R2xVWUpBbnRGUWp2aWwzNlBDVXQxTW95cXYzZyIsInJpZCI6IjhjM2Y3ZmVlLWVjZDItNDE1MC04MWNmLTFkNzlhMDdmNTk4MSJ9.S57kd_O_QEXq9nCf9O1GqJBf029pqppKx2sQA3gV0bVVruKAW0uTHeImwgdjm9eC14nvVXLf3Q9gvOOCr4TWBA';

const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

async function main() {
  const target = process.argv[2]; // email or userId (or 'all')
  const targetTier = process.argv[3] || 'free'; // 'free' or 'pro'
  const targetCredits = parseInt(process.argv[4] || (targetTier === 'free' ? '100' : '1000'), 10);

  console.log(`\n==============================================`);
  console.log(`🔧 eStudesk Turso User Reset & Override Tool`);
  console.log(`==============================================`);

  if (!target) {
    console.log(`\nUsage:`);
    console.log(`  node scripts/reset-user.mjs <user_email_or_id> [tier] [credits]`);
    console.log(`  node scripts/reset-user.mjs all free 100\n`);
    console.log(`Listing all current users in database:`);
    const users = await client.execute(`SELECT id, email, name, generation_tier, credit_balance FROM user`);
    console.table(users.rows);
    process.exit(0);
  }

  let userRows;
  if (target === 'all') {
    const res = await client.execute(`SELECT id, email, name FROM user`);
    userRows = res.rows;
  } else {
    const res = await client.execute({
      sql: `SELECT id, email, name FROM user WHERE email = ? OR id = ?`,
      args: [target, target],
    });
    userRows = res.rows;
  }

  if (!userRows || userRows.length === 0) {
    console.error(`❌ No user found matching: "${target}"`);
    process.exit(1);
  }

  for (const u of userRows) {
    console.log(`\nResetting user: ${u.name || 'Student'} (${u.email || u.id})...`);

    // 1. Update user tier and credit balance
    await client.execute({
      sql: `UPDATE user SET generation_tier = ?, credit_balance = ?, updated_at = ? WHERE id = ?`,
      args: [targetTier, targetCredits, new Date().toISOString(), u.id],
    });

    // 2. Mark active subscriptions as canceled if resetting to free
    if (targetTier === 'free') {
      await client.execute({
        sql: `UPDATE subscriptions SET status = 'canceled', cancel_at_period_end = 0, updated_at = ? WHERE user_id = ?`,
        args: [new Date().toISOString(), u.id],
      });
    }

    // 3. Insert credit transaction audit entry
    await client.execute({
      sql: `INSERT INTO credit_transactions (id, user_id, amount, type, balance_after, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        u.id,
        targetCredits,
        targetTier === 'free' ? 'initial_grant' : 'bonus',
        targetCredits,
        `CLI Reset/Override to ${targetTier} with ${targetCredits} credits`,
        new Date().toISOString(),
      ],
    });

    console.log(`✅ Success: Set ${u.email} to Tier="${targetTier}", Credit Balance=${targetCredits}`);
  }

  console.log(`\n🎉 All done!\n`);
}

main().catch((err) => {
  console.error('Error resetting user:', err);
  process.exit(1);
});
