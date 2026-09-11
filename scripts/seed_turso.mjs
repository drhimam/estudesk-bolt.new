import fs from 'node:fs';
import { createClient } from '@libsql/client';

const envContent = fs.readFileSync('.env', 'utf-8');
const envVars = Object.fromEntries(
  envContent
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const url = envVars.TURSO_DATABASE_URL || envVars.DATABASE_URL;
const authToken = envVars.TURSO_AUTH_TOKEN;

console.log('Connecting to Turso:', url);
const client = createClient({ url, authToken });

async function checkAndSeed() {
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
  console.log('Turso Tables in Database:');
  console.log(tables.rows.map(r => r.name));

  // Seed default subscription plans into subscription_plans table
  const plans = [
    {
      id: 'free',
      name: 'Free',
      billing_cycle: 'once',
      duration_months: 1,
      price_amount: 0.0,
      currency: 'USD',
      discount_percent: 0,
      discount_reason: null,
      is_active: 1,
      ai_credits_monthly: 100,
      features: JSON.stringify([
        '100 Initial AI Generation Credits',
        'Basic Study Notes & Flashcards Generator',
        'Local Dexie.js Offline Storage + Cloud Sync',
        'Standard AI Generation Queue',
        'Export Study Materials to TXT'
      ]),
      sort_order: 1
    },
    {
      id: 'pro_monthly',
      name: 'Pro Monthly',
      billing_cycle: 'monthly',
      duration_months: 1,
      price_amount: 9.99,
      currency: 'USD',
      discount_percent: 0,
      discount_reason: null,
      is_active: 1,
      ai_credits_monthly: 1000,
      features: JSON.stringify([
        '1,000 AI Generation Credits / month',
        'All 7 Study Formats (Notes, Cheatsheets, Flashcards, Quizzes, Infographics, Assignments, Slides)',
        'Multi-Modal Source Extraction (PDF, DOCX, TXT, CSV, Audio, OCR)',
        '24h Deadline Email Alerts & Monday Weekly Digests',
        'Priority High-Speed AI Router (DeepSeek V3 / MiMo / Gemini)',
        'Rich PDF, TXT, & JSON Study Material Downloads'
      ]),
      sort_order: 2
    },
    {
      id: 'pro_semester',
      name: 'Pro Semester (4 Months)',
      billing_cycle: 'semester',
      duration_months: 4,
      price_amount: 29.99,
      currency: 'USD',
      discount_percent: 25,
      discount_reason: 'Semester Saver • 25% Off',
      is_active: 1,
      ai_credits_monthly: 1000,
      features: JSON.stringify([
        '1,000 AI Generation Credits / month (4,000 total credits)',
        'Full University 4-Month Semester Coverage',
        'All 7 Study Material Formats with Instant AI Refinements',
        'Multi-Modal Source Extraction (PDF, OCR Image, Audio Transcripts)',
        '24h Deadline Alerts & Timezone-Aware Weekly Digests',
        'Full Semester Archive One-Click Student Backup',
        'Dedicated High-Throughput AI Priority Queue'
      ]),
      sort_order: 3
    },
    {
      id: 'pro_yearly',
      name: 'Pro Yearly',
      billing_cycle: 'yearly',
      duration_months: 12,
      price_amount: 79.99,
      currency: 'USD',
      discount_percent: 35,
      discount_reason: 'Annual Best Value • 35% Off',
      is_active: 0,
      ai_credits_monthly: 1000,
      features: JSON.stringify([
        '1,000 AI Generation Credits / month (12,000 total credits)',
        'Full 12-Month Academic Access to All Features',
        'All 7 Study Material Types & Infinite Version History',
        'Advanced Multi-Modal File Parser & Instant Tesseract OCR',
        'Priority Email Notifications & Weekly Digest Reports',
        'VIP Priority AI Routing & Early Feature Access'
      ]),
      sort_order: 4
    }
  ];

  for (const p of plans) {
    const existing = await client.execute({
      sql: 'SELECT id FROM subscription_plans WHERE id = ?',
      args: [p.id]
    });
    if (existing.rows.length === 0) {
      await client.execute({
        sql: `INSERT INTO subscription_plans (id, name, billing_cycle, duration_months, price_amount, currency, discount_percent, discount_reason, is_active, ai_credits_monthly, features, sort_order, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [
          p.id,
          p.name,
          p.billing_cycle,
          p.duration_months,
          p.price_amount,
          p.currency,
          p.discount_percent,
          p.discount_reason,
          p.is_active,
          p.ai_credits_monthly,
          p.features,
          p.sort_order
        ]
      });
      console.log(`Seeded plan: ${p.name}`);
    } else {
      console.log(`Plan already exists: ${p.name}`);
    }
  }

  const seededPlans = await client.execute('SELECT id, name, price_amount, discount_percent, discount_reason, is_active, ai_credits_monthly FROM subscription_plans');
  console.log('\n--- Live subscription_plans in Turso ---');
  console.table(seededPlans.rows);
}

checkAndSeed().catch(console.error);
