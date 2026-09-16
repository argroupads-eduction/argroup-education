import { writeFileSync } from 'node:fs';
import { DELETE_BLOG_SLUGS } from './delete-blog-slugs-list.mjs';

const slugs = [...new Set(DELETE_BLOG_SLUGS.map((s) => s.trim()).filter(Boolean))];
const size = 40;
let batch = 0;

for (let i = 0; i < slugs.length; i += size) {
  const chunk = slugs.slice(i, i + size);
  const list = chunk.map((s) => `'${s.replace(/'/g, "''")}'`).join(', ');
  const sql = `
WITH target AS (SELECT id FROM cms.posts WHERE slug IN (${list}))
DELETE FROM cms._posts_v_version_populated_authors
WHERE parent_id IN (SELECT id FROM cms._posts_v WHERE parent_id IN (SELECT id FROM target));

WITH target AS (SELECT id FROM cms.posts WHERE slug IN (${list}))
DELETE FROM cms._posts_v_rels
WHERE parent_id IN (SELECT id FROM cms._posts_v WHERE parent_id IN (SELECT id FROM target));

WITH target AS (SELECT id FROM cms.posts WHERE slug IN (${list}))
DELETE FROM cms._posts_v WHERE parent_id IN (SELECT id FROM target);

WITH target AS (SELECT id FROM cms.posts WHERE slug IN (${list}))
DELETE FROM cms.posts_rels WHERE parent_id IN (SELECT id FROM target);

WITH target AS (SELECT id FROM cms.posts WHERE slug IN (${list}))
DELETE FROM cms.posts_populated_authors WHERE _parent_id IN (SELECT id FROM target);

DELETE FROM cms.posts WHERE slug IN (${list});

UPDATE public."BlogPost"
SET published = false, "updatedAt" = NOW()
WHERE slug IN (${list});

SELECT 'batch_${batch}' AS batch,
  (SELECT count(*)::int FROM cms.posts WHERE slug IN (${list})) AS cms_left,
  (SELECT count(*)::int FROM public."BlogPost" WHERE slug IN (${list}) AND published = true) AS still_published;
`.trim();
  writeFileSync(`scripts/_del_batch_${batch}.sql`, `${sql}\n`);
  console.log('wrote batch', batch, chunk.length);
  batch += 1;
}

console.log('total batches', batch, 'slugs', slugs.length);
