/**
 * Create Header menu tables/enums (non-interactive). Safe to re-run.
 * Usage: node scripts/sync-menu-schema.mjs
 */
import 'dotenv/config'
import pg from 'pg'

const sql = `
DO $$ BEGIN
  CREATE TYPE "public"."enum_header_menu_items_sub_items_college_links_link_type" AS ENUM('page', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_header_menu_items_sub_items_link_type" AS ENUM('page', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_header_menu_items_link_type" AS ENUM('page', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_header_menu_items_mega_menu" AS ENUM('none', 'mbbs-india', 'mbbs-abroad', 'md-ms');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "header_menu_items" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "label" varchar NOT NULL,
  "link_type" "enum_header_menu_items_link_type" DEFAULT 'page',
  "page_id" integer,
  "url" varchar,
  "mega_menu" "enum_header_menu_items_mega_menu" DEFAULT 'none'
);

CREATE TABLE IF NOT EXISTS "header_menu_items_sub_items" (
  "_order" integer NOT NULL,
  "_parent_id" varchar NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "label" varchar NOT NULL,
  "link_type" "enum_header_menu_items_sub_items_link_type" DEFAULT 'page',
  "page_id" integer,
  "url" varchar
);

CREATE TABLE IF NOT EXISTS "header_menu_items_sub_items_college_links" (
  "_order" integer NOT NULL,
  "_parent_id" varchar NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "label" varchar NOT NULL,
  "link_type" "enum_header_menu_items_sub_items_college_links_link_type" DEFAULT 'page',
  "page_id" integer,
  "url" varchar
);

DO $$ BEGIN
  ALTER TABLE "header_menu_items" ADD CONSTRAINT "header_menu_items_page_id_pages_id_fk"
    FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "header_menu_items" ADD CONSTRAINT "header_menu_items_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "header_menu_items_sub_items" ADD CONSTRAINT "header_menu_items_sub_items_page_id_pages_id_fk"
    FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "header_menu_items_sub_items" ADD CONSTRAINT "header_menu_items_sub_items_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."header_menu_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "header_menu_items_sub_items_college_links" ADD CONSTRAINT "header_menu_items_sub_items_college_links_page_id_pages_id_fk"
    FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "header_menu_items_sub_items_college_links" ADD CONSTRAINT "header_menu_items_sub_items_college_links_parent_id_fk"
    FOREIGN KEY ("_parent_id") REFERENCES "public"."header_menu_items_sub_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "header_menu_items_order_idx" ON "header_menu_items" ("_order");
CREATE INDEX IF NOT EXISTS "header_menu_items_parent_id_idx" ON "header_menu_items" ("_parent_id");
CREATE INDEX IF NOT EXISTS "header_menu_items_page_idx" ON "header_menu_items" ("page_id");
CREATE INDEX IF NOT EXISTS "header_menu_items_sub_items_order_idx" ON "header_menu_items_sub_items" ("_order");
CREATE INDEX IF NOT EXISTS "header_menu_items_sub_items_parent_id_idx" ON "header_menu_items_sub_items" ("_parent_id");
CREATE INDEX IF NOT EXISTS "header_menu_items_sub_items_page_idx" ON "header_menu_items_sub_items" ("page_id");
CREATE INDEX IF NOT EXISTS "header_menu_items_sub_items_college_links_order_idx" ON "header_menu_items_sub_items_college_links" ("_order");
CREATE INDEX IF NOT EXISTS "header_menu_items_sub_items_college_links_parent_id_idx" ON "header_menu_items_sub_items_college_links" ("_parent_id");
CREATE INDEX IF NOT EXISTS "header_menu_items_sub_items_college_links_page_idx" ON "header_menu_items_sub_items_college_links" ("page_id");
`

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
await client.query(sql)
await client.end()
console.log('[sync-menu-schema] Menu tables ready.')
