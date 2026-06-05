import 'dotenv/config';
import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const r = await client.query(`
  SELECT table_name, column_name, data_type, character_maximum_length
  FROM information_schema.columns
  WHERE column_name LIKE '%html_content%'
  ORDER BY table_name
`);
console.log(r.rows);
await client.end();
