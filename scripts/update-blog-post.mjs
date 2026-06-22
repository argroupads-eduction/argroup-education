/**
 * Update a single post in apps/frontend/data/wp-export-bundle/posts.json
 * Usage: node scripts/update-blog-post.mjs <slug>
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];

if (!slug) {
  console.error('Usage: node scripts/update-blog-post.mjs <slug>');
  process.exit(1);
}

const postsPath = path.join(root, 'apps/frontend/data/wp-export-bundle/posts.json');
const contentPath = path.join(root, `apps/frontend/data/blog-content/${slug}-2026.html`);

const posts = JSON.parse(await readFile(postsPath, 'utf8'));
const index = posts.findIndex((p) => p.slug === slug);
if (index < 0) {
  console.error(`Post not found: ${slug}`);
  process.exit(1);
}

const html = await readFile(contentPath, 'utf8');
const featured = '/images/blog/top-medical-colleges-in-india-2026.png';
const published = '2026-06-17T09:00:00';

const updated = {
  ...posts[index],
  title: 'Which Are the Top Medical Colleges in India in 2026?',
  link: 'https://www.argroupofeducation.com/blog/top-medical-colleges-in-india/',
  content: `\n${html.trim()}\n`,
  excerpt:
    '<p>Every year, lakhs of students dream of becoming a doctor. After qualifying for NEET, the first question that comes to mind: Which are the top medical colleges in India? This 2026 guide covers AIIMS, CMC, JIPMER, admissions, and MBBS career paths.</p>\n',
  date: published,
  modified: published,
  featuredImage: featured,
  metaTitle: 'Top Medical Colleges in India 2026 | AIIMS & More',
  metaDescription:
    'Discover the top medical colleges in India for 2026, including AIIMS, CMC, and JIPMER. Compare rankings, admissions, and MBBS.',
  canonicalUrl: 'https://www.argroupofeducation.com/blog/top-medical-colleges-in-india/',
  keywords: [
    'Top Medical Colleges in India 2026',
    'Best Medical Colleges in India',
    'List of Medical Colleges in India',
    'Medical college admission in India',
    'AIIMS New Delhi',
    'MAMC',
    'CMC Vellore',
    'JIPMER Puducherry',
    'PGIMER Chandigarh',
    'MBBS consultant for India and abroad',
    'MBBS in India',
    'MBBS Abroad',
    'NEET Rank',
    'MD/MS admission in India',
    'AR Group of Education',
    'NEET score',
  ],
  ogImage: featured,
};

posts[index] = updated;

// Move to front of array so bundle order matches featured intent (date sort still primary).
const [item] = posts.splice(index, 1);
posts.unshift(item);

await writeFile(postsPath, `${JSON.stringify(posts, null, 2)}\n`, 'utf8');
console.log(`Updated post: ${slug}`);
