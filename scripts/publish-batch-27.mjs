/**
 * Publish 27 Google-Doc blogs to live MySQL + optional Strapi.
 * Slug = primary keyword. Dates: 20 Aug 2026 → 23 Sep 2026.
 * Does not print secrets.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadEnv,
  parseMetaAndBody,
  convertBody,
  schemaFromDoc,
  site,
  gh,
} from './repair-three-college-blogs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = path.join(process.env.TEMP || '/tmp', 'ar-blogs-27');
const assets =
  'C:\\Users\\akash\\.cursor\\projects\\c-Users-akash-OneDrive-Desktop-ARGROUP-OF-EDUCTION\\assets';
const imgDir = path.join(root, 'apps/frontend/public/images/blog');

const FILES = [
  {
    file: '01-sramachandra.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_How_Much_NEET_Score_Is_Required_for_Sri_Ramachandra_Medical_College-fc0a299f-f54d-4cd6-ad80-7cf406b09a26.webp',
  },
  {
    file: '02-jss.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_What_Is_the_Fee_Structure_of_JSS_Medical_College_Mysuru-14ac81d4-3aab-4345-aa36-9e3dec0cbdac.webp',
  },
  {
    file: '03-dattameghe.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_What_Is_the_NEET_Cut-Off_Mark_for_Datta_Meghe_Medical_College_Wardha-1d679ec8-f89e-4508-8955-a1e951ffb66d.webp',
  },
  {
    file: '04-nri-quota.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_What_Is_the_NEET_Cut-Off_Score_for_NRI_Quota_for_MBBS_in_India-a37945c5-90c2-45c0-ac76-e052bad83ba7.webp',
  },
  {
    file: '05-jnmc-kle.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_What_is_the_NEET_Cut_Off_for_Jawaharlal_Nehru_Medical_College__KLE_University___Belagavi-4c1db30a-4c18-4642-bd5b-0660a766d379.webp',
  },
  {
    file: '06-symbiosis.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_What_Is_the_NEET_Cut_Off_for_Symbiosis_Medical_College_for_Women__Pune-9b9dce81-20a1-44ef-980c-0727e41b3f99.webp',
  },
  {
    file: '07-bharati.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_What_Is_the_NEET_Cutoff_for_Bharati_Vidyapeeth_University_Medical_College__Pune-f11fdb81-e220-4d00-85d4-781a5906c14e.webp',
  },
  {
    file: '08-neet-pg-compulsory.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_Is_NEET_PG_Compulsory_for_MDMS_Admission-e907bc6c-b385-4331-ac8e-04aefc6db648.webp',
  },
  {
    file: '09-mdms-process.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_What_is_the_Process_for_MDMS_Admission_in_India-e8d0ab35-b1c4-4406-9158-512aca46d59f.webp',
  },
  {
    file: '10-md-vs-ms.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_What_is_the_Difference_Between_MD_and_MS_Specialization-ab6635ea-c807-4e6a-b1cc-1f26d6f829c4.webp',
  },
  {
    file: '11-neet-pg-counselling.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_How_Does_The_NEET_PG_Counselling_Process_Work-c77d0fb1-cbd3-4cae-96b2-cf55b990965b.webp',
  },
  {
    file: '12-best-courses-after-mbbs.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_Best_Courses_After_MBBS_in_India_2026_Full_List__Fees___Career_Scope-4780a64f-8f7e-424d-93aa-015af6673e4c.webp',
  },
  {
    file: '13-best-mdms-college.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_Which_Is_the_Best_MDMS_College_in_India-c5bbd020-c3fa-4f73-a050-b9b0a3fdaa71.webp',
  },
  {
    file: '14-mdms-management.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_MDMS_Management_Quota_Admission_2026_Complete_Guide_to_Fees__Seat_Matrix___NRI_Admission-8fcd0626-28bf-46f3-a116-92fccc87381c.webp',
  },
  {
    file: '15-pavlov.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_What_Are_the_Fees_for_the_First_Pavlov_State_Medical_University_of_St._Petersburg-4efee6b7-22a0-4f39-b3c2-00e1acaee950.webp',
  },
  {
    file: '16-kursk.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_What_Is_the_Tuition_Fee_for_Kursk_State_Medical_University_Fees__MBBS_Cost___Admission_Guide-f19558e5-608d-4bcd-b5b1-581d59f92c16.webp',
  },
  {
    file: '17-bams-admission.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_How_Do_I_Get_Admission_in_BAMS_Eligibility__NEET_Score___Counselling_Guide_2026-0d4209c3-a8c5-4512-88de-1acbf99c1a92.webp',
  },
  {
    file: '18-low-neet-pg-rank.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_Low_NEET_PG_Rank_Here_s_How_to_Still_Secure_an_MDMS_Seat_in_2026-9b670c94-791a-4adb-a93b-886ef7a8d5dc.webp',
  },
  {
    file: '19-ayush-qualifying.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_What_Are_the_NEET_Qualifying_Marks_for_AYUSH_Counselling_2026_Guide-7bd76fce-61a2-453a-8525-ed14547d55cf.webp',
  },
  {
    file: '20-470-neet-pg.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_Is_470_a_Good_Score_in_NEET_PG_2026-81422bd1-675b-48cc-b1e0-7005f10fb2cc.webp',
  },
  {
    file: '21-20000-rank.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_How_Many_Marks_for_20_000_Rank_in_NEET_PG-3514ab8a-6cfa-4861-bd9a-d8a4aa1dbaef.webp',
  },
  {
    file: '22-580-neet-pg.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_Is_580_a_Good_Score_in_NEET_PG-de9a79d5-e852-4e86-96b2-14d928620b9b.webp',
  },
  {
    file: '23-direct-bams.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_Can_I_Get_Direct_Admission_in_BAMS_Without_Counselling-6acba7b4-54eb-429f-a7b1-5af706508d30.webp',
  },
  {
    file: '24-bams-200.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_Can_I_Get_Admission_in_BAMS_with_200_Marks_in_NEET-75a45d58-db8a-491e-9f2c-6331a7e74bd6.webp',
  },
  {
    file: '25-neet-pg-md-marks.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_How_Many_Marks_Are_Required_in_NEET_PG_for_MD-3a334959-937b-4d1f-b761-d51ddb67c59a.webp',
  },
  {
    file: '26-neet-pg-cutoff-2026.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_What_Is_the_Expected_Cutoff_Score_for_NEET_PG_2026-fcf90fe0-490f-4775-9f55-c0cb07af19c9.webp',
  },
  {
    file: '27-top10-after-mbbs.txt',
    asset:
      'c__Users_akash_AppData_Roaming_Cursor_User_workspaceStorage_eed535d247bf1647b858f6dd47f5c2e5_images_Top_10_Medical_Courses_After_MBBS_Best_Options_for_a_Great_Career-370c86f3-e966-4f76-8f09-6759f2604069.webp',
  },
];

function toSlug(raw) {
  return String(raw || '')
    .replace(/,/g, ' ')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function pickTitle(meta, bodyLines, fallback) {
  const mt = meta['meta title'];
  for (const line of bodyLines) {
    const t = line.trim();
    if (t.length > 20 && (t.endsWith('?') || /^[A-Z0-9].{15,140}$/.test(t))) {
      return t.replace(/\s+/g, ' ');
    }
  }
  return mt || fallback;
}

function dateAt(index, total) {
  const start = Date.UTC(2026, 7, 20, 10, 0, 0);
  const end = Date.UTC(2026, 8, 23, 10, 0, 0);
  const t = start + ((end - start) * index) / Math.max(total - 1, 1);
  return new Date(t).toISOString();
}

function buildPosts() {
  const used = new Set();
  const posts = [];
  for (let i = 0; i < FILES.length; i++) {
    const spec = FILES[i];
    const raw = fs.readFileSync(path.join(tmp, spec.file), 'utf8');
    const { meta, bodyLines, schemas } = parseMetaAndBody(raw);
    const focusKeyword = (
      meta['primary keyword'] ||
      meta['primary keywords'] ||
      ''
    ).trim();
    let slug = toSlug(focusKeyword);
    if (!slug) slug = toSlug(spec.file.replace(/^\d+-/, '').replace(/\.txt$/, ''));
    if (used.has(slug)) slug = `${slug}-${String(i + 1).padStart(2, '0')}`;
    used.add(slug);
    const title = pickTitle(meta, bodyLines, focusKeyword);
    const { html, faqs } = convertBody(bodyLines, title);
    const imageFile = `${slug}.webp`;
    posts.push({
      spec,
      slug,
      title,
      focusKeyword,
      meta,
      html,
      faqs,
      schemas,
      imageFile,
      publishedAt: dateAt(i, FILES.length),
    });
  }
  return posts;
}

fs.mkdirSync(imgDir, { recursive: true });
const posts = buildPosts();

for (const p of posts) {
  const src = path.join(assets, p.spec.asset);
  const dest = path.join(imgDir, p.imageFile);
  if (!fs.existsSync(src)) {
    console.error('MISSING IMAGE', p.slug, src);
    process.exit(1);
  }
  if (!fs.existsSync(dest)) {
    try {
      fs.copyFileSync(src, dest);
    } catch (err) {
      console.warn('image copy skip', p.imageFile, err.code);
    }
  }
}

const leakRe = /ld\+json|@context|<script|FAQPage\s*Schema|BlogPosting\s*Schema/i;
let leak = false;
for (const p of posts) {
  const tables = (p.html.match(/<table/gi) || []).length;
  const faqs = (p.html.match(/wp-premium-faq"/g) || []).length;
  const hasLeak = leakRe.test(p.html);
  if (hasLeak) leak = true;
  console.log(
    p.publishedAt.slice(0, 10),
    p.slug,
    'html',
    p.html.length,
    'faqs',
    p.faqs.length,
    'faqHtml',
    faqs,
    'tables',
    tables,
    hasLeak ? 'LEAK' : 'ok'
  );
}
if (leak) {
  console.error('Schema leak in HTML — abort');
  process.exit(1);
}

const seed = posts.map((p) => ({
  slug: p.slug,
  title: p.title,
  focusKeyword: p.focusKeyword,
  publishedAt: p.publishedAt,
  imageFile: p.imageFile,
  metaTitle: p.meta['meta title'] || p.title,
  metaDescription: p.meta['meta description'] || '',
}));
const seedPath = path.join(root, 'apps/strapi/data/batch27-blogs-seed.json');
fs.mkdirSync(path.dirname(seedPath), { recursive: true });

if (process.env.DRY_RUN === '1') {
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2));
  console.log('Dry-run OK', posts.length, 'wrote', seedPath);
  process.exit(0);
}

const env = {
  ...loadEnv(path.join(root, 'apps/frontend/.env.local')),
  ...loadEnv(path.join(root, 'apps/frontend/.env.hostinger')),
};
const secret = env.PAYLOAD_SYNC_SECRET || env.REVALIDATE_SECRET;
if (!secret) {
  console.error('Missing sync secret');
  process.exit(1);
}

const outSeed = [];
for (const p of posts) {
  const featuredImage = `${gh}/${p.imageFile}`;
  const metaTitle = p.meta['meta title'] || p.title;
  const metaDescription =
    p.meta['meta description'] ||
    p.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
  const keywords = (p.meta['secondary keywords'] || p.meta['secondary keyword'] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const schemaJson = schemaFromDoc(p.schemas, p.faqs, {
    title: p.title,
    slug: p.slug,
    featuredImage,
    metaDescription,
    publishedAt: p.publishedAt,
  });
  const payload = {
    type: 'post',
    slug: p.slug,
    title: p.title,
    content: p.html,
    excerpt: metaDescription,
    featuredImage,
    ogImage: featuredImage,
    category: 'Blog',
    metaTitle,
    metaDescription,
    focusKeyword: p.focusKeyword,
    keywords,
    tags: keywords.slice(0, 8),
    schemaJson,
    published: true,
    publishedAt: p.publishedAt,
    notifyPush: false,
    pullFromCms: false,
  };
  const res = await fetch(`${site}/api/cms/payload-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  const ok = text.includes('"success":true');
  console.log('SYNC', p.slug, res.status, ok);
  if (!ok) {
    console.error(text.slice(0, 400));
    process.exit(1);
  }
  outSeed.push(payload);
}

fs.writeFileSync(seedPath, JSON.stringify(outSeed, null, 2));
console.log('Live sync OK', outSeed.length);

const strapiUrl = (
  process.env.STRAPI_URL ||
  'https://mintcream-echidna-747154.hostingersite.com'
).replace(/\/$/, '');
const strapiToken = process.env.STRAPI_TOKEN || '';
if (!strapiToken) {
  console.log('CMS skip: set STRAPI_TOKEN to import into Strapi');
} else {
  let cmsOk = 0;
  for (const p of outSeed) {
    const body = {
      data: {
        title: p.title,
        slug: p.slug,
        content: p.content,
        excerpt: p.excerpt,
        featuredImage: p.featuredImage,
        category: 'Blog',
        tags: p.tags,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        focusKeyword: p.focusKeyword,
        keywords: p.keywords,
        ogImage: p.ogImage,
        schemaJson: p.schemaJson,
        legacyPublishedAt: p.publishedAt,
      },
    };
    const find = await fetch(
      `${strapiUrl}/api/posts?filters[slug][$eq]=${encodeURIComponent(p.slug)}`,
      { headers: { Authorization: `Bearer ${strapiToken}` } }
    );
    const found = await find.json().catch(() => ({}));
    const id = found?.data?.[0]?.id || found?.data?.[0]?.documentId;
    const url = id ? `${strapiUrl}/api/posts/${id}` : `${strapiUrl}/api/posts`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${strapiToken}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) cmsOk++;
    else console.log('CMS fail', p.slug, res.status, (await res.text()).slice(0, 160));
  }
  console.log('CMS upserted', cmsOk, '/', outSeed.length);
}
