import 'dotenv/config';
import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const db = await client.query('SELECT current_database() AS name');
console.log('DATABASE_URL points to database:', db.rows[0].name);

const schemas = await client.query(`
  SELECT schema_name FROM information_schema.schemata
  WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
  ORDER BY schema_name
`);
console.log('\nSchemas:', schemas.rows.map((r) => r.schema_name).join(', '));

const tables = await client.query(`
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  ORDER BY 1, 2
`);
console.log('\nTables (' + tables.rows.length + '):');
for (const r of tables.rows) {
  console.log('  -', r.table_schema + '.' + r.table_name);
}

for (const t of ['posts', 'pages', 'users', 'media']) {
  try {
    const c = await client.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
    console.log(`${t}:`, c.rows[0].n, 'rows');
  } catch (e) {
    console.log(`${t}: (missing)`, e.message);
  }
}

await client.end();
