#!/usr/bin/env node
import {
  parseWpPostmeta,
  parseWpPosts,
  parseWpYoastIndexable,
} from './parse-wp-sql.mjs';
import { yoastSeoOnlyFromPostmeta } from './yoast-from-meta.mjs';
import { mergeIndexableAndMeta } from './yoast-from-indexable.mjs';
import { hasAnyYoastSeoField } from './yoast-seo-fields.mjs';

const sample = `
INSERT INTO \`wp_posts\` (\`ID\`, \`post_author\`, \`post_date\`, \`post_date_gmt\`, \`post_content\`, \`post_title\`, \`post_excerpt\`, \`post_status\`, \`comment_status\`, \`ping_status\`, \`post_password\`, \`post_name\`, \`to_ping\`, \`pinged\`, \`post_modified\`, \`post_modified_gmt\`, \`post_content_filtered\`, \`post_parent\`, \`guid\`, \`menu_order\`, \`post_type\`, \`post_mime_type\`, \`comment_count\`) VALUES
(10, 1, '2024-01-01', '2024-01-01', '', 'Sample Page', '', 'publish', 'closed', 'closed', '', 'sample-page', '', '', '2024-01-01', '2024-01-01', '', 0, 'https://example.com/?page_id=10', 0, 'page', '', 0);

INSERT INTO \`wp_yoast_indexable\` (\`object_id\`, \`object_type\`, \`object_sub_type\`, \`permalink\`, \`title\`, \`description\`, \`canonical\`, \`open_graph_title\`, \`open_graph_description\`, \`twitter_title\`, \`twitter_description\`) VALUES
(10, 'post', 'page', 'https://example.com/sample-page/', 'Indexable Title', 'Indexable desc', 'https://example.com/sample-page/', 'OG from index', 'OG desc', 'TW title', 'TW desc');

INSERT INTO \`wp_postmeta\` (\`meta_id\`, \`post_id\`, \`meta_key\`, \`meta_value\`) VALUES
(1, 10, '_yoast_wpseo_title', 'Should lose to indexable'),
(2, 10, '_yoast_wpseo_metadesc', 'Meta fallback only if missing');
`;

const posts = parseWpPosts(sample);
const indexable = parseWpYoastIndexable(sample);
const meta = parseWpPostmeta(sample);
const merged = mergeIndexableAndMeta(
  indexable.get(10),
  yoastSeoOnlyFromPostmeta(meta.get(10), posts)
);

const ok =
  hasAnyYoastSeoField(merged) &&
  merged.metaTitle === 'Indexable Title' &&
  merged.ogTitle === 'OG from index' &&
  merged.twitterDescription === 'TW desc';

console.log(ok ? 'parse-wp-sql selftest: OK' : 'parse-wp-sql selftest: FAILED', merged);
process.exit(ok ? 0 : 1);
