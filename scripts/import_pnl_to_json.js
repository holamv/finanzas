const fs = require('fs');
const path = require('path');

// Usage: node import_pnl_to_json.js
// Reads data/pnl_input.tsv (tab-separated) and writes data/pnl_db.json

// Support either CSV or TSV input. Prefer CSV if present.
let INPUT = path.join(__dirname, '..', 'data', 'pnl_input.csv');
if (!fs.existsSync(INPUT)) {
  INPUT = path.join(__dirname, '..', 'data', 'pnl_input.tsv');
}
const OUTPUT = path.join(__dirname, '..', 'data', 'pnl_db.json');

if (!fs.existsSync(INPUT)) {
  console.error(`Input file not found: ${INPUT}`);
  console.error('Please create a tab-separated file with header: Category\tUnit\t2025-01\t2025-02\t...');
  process.exit(1);
}

const raw = fs.readFileSync(INPUT, 'utf8');
const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
if (lines.length < 2) {
  console.error('Input needs at least a header row and one data row');
  process.exit(1);
}

// parse header
const header = lines[0].split(/\t|,/).map(h => h.trim());
const monthCols = header.slice(2);

const months = monthCols.map((m, idx) => ({ index: idx, label: m }));

const metrics = [];

// Targets to treat as main sections (will become parents)
const TARGET_METRICS = [
  'SALES','REVENUE','SALES REDUCTION','NET REVENUE','COGS','GROSS MARGIN',
  'MARKETING COSTS','MARKETING COST','SALES PAYROLL','CONTRIBUTION MARGIN',
  'EXPENSES (PAYROLL)','EXPENSES','TAX EXPENSES','EBITDA','BURN RATE'
].map(s => s.replace(/[^A-Z0-9]/gi, '').toUpperCase());

// Submetrics mapping
const SUB_MAP = [
  { keys: ['SCHEDULED','SCHEDULED ORDERS'], key: 'scheduled' },
  { keys: ['ON DEMAND','ONDEMAND','ON_DEMAND','ON DEMAND ORDERS','ON_DEMAND_ORDERS'], key: 'on_demand' },
  { keys: ['FRANCHISE','FRANCHISES'], key: 'franchises' }
];

const normalize = s => (s||'').toString().toUpperCase().replace(/[^A-Z0-9]/g,'');

let currentMain = null;

for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split(/\t|,/).map(c => c.trim());
  const rawCategory = cols[0] || '';
  const categoryNorm = normalize(rawCategory);
  const unit = cols[1] || '';

  const vals = monthCols.map((_, k) => {
    const rawv = cols[2 + k] || '';
    const clean = rawv.toString().replace(/,/g, '').replace(/\(/g,'-').replace(/\)/g,'').replace('%','').trim();
    const n = Number(clean);
    return isNaN(n) ? 0 : n;
  });

  // Is this a main metric?
  if (TARGET_METRICS.includes(categoryNorm)) {
    const obj = { category: rawCategory, unit, values: vals, sub_metrics: {} };
    metrics.push(obj);
    currentMain = obj;
    continue;
  }

  // Is it a submetric?
  let mapped = null;
  for (const m of SUB_MAP) {
    for (const k of m.keys) {
      if (categoryNorm.includes(normalize(k))) {
        mapped = m.key;
        break;
      }
    }
    if (mapped) break;
  }

  if (mapped && currentMain) {
    // sum into currentMain.sub_metrics[mapped]
    if (!currentMain.sub_metrics[mapped]) currentMain.sub_metrics[mapped] = Array.from({ length: monthCols.length }, () => 0);
    currentMain.sub_metrics[mapped] = currentMain.sub_metrics[mapped].map((v, idx) => v + (vals[idx] || 0));
    continue;
  }

  // fallback: push as standalone metric
  metrics.push({ category: rawCategory, unit, values: vals });
  currentMain = null;
}

const db = { months, metrics, generated_at: new Date().toISOString() };
fs.writeFileSync(OUTPUT, JSON.stringify(db, null, 2), 'utf8');
console.log('Wrote', OUTPUT, 'with', metrics.length, 'metrics and', months.length, 'months');
