import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/** html_content must be TEXT (not varchar) for full WP page bodies; add seo keywords. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS pages
      ALTER COLUMN html_content TYPE text USING html_content::text;
    ALTER TABLE IF EXISTS _pages_v
      ALTER COLUMN version_html_content TYPE text USING version_html_content::text;
    ALTER TABLE IF EXISTS posts
      ALTER COLUMN html_content TYPE text USING html_content::text;
    ALTER TABLE IF EXISTS _posts_v
      ALTER COLUMN version_html_content TYPE text USING version_html_content::text;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE IF EXISTS pages
      ALTER COLUMN html_content TYPE varchar USING html_content::varchar;
    ALTER TABLE IF EXISTS _pages_v
      ALTER COLUMN version_html_content TYPE varchar USING version_html_content::varchar;
    ALTER TABLE IF EXISTS posts
      ALTER COLUMN html_content TYPE varchar USING html_content::varchar;
    ALTER TABLE IF EXISTS _posts_v
      ALTER COLUMN version_html_content TYPE varchar USING version_html_content::varchar;
  `)
}
