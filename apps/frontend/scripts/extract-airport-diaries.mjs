import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pages = JSON.parse(
  readFileSync(join(__dirname, '../data/wp-export-bundle/pages.json'), 'utf8')
);

const page = pages.find((x) => x.slug === 'study-mbbs-in-abroad');
const html = page.content || '';

const marker = 'elementor-element-16bff1e';
const start = html.indexOf(marker);
if (start < 0) {
  console.error('carousel widget not found');
  process.exit(1);
}

// Carousel widget ends at next elementor-element or section close — grab ~15k chars
const chunk = html.slice(start, start + 25000);
const imgRe = /src="([^"]+)"/g;
const images = [];
let m;
while ((m = imgRe.exec(chunk)) !== null) {
  if (!m[1].includes('wp-content/uploads') || m[1].endsWith('.svg')) continue;
  images.push(m[1]);
}

const unique = [...new Set(images)];
console.log('Airport Diaries carousel images:', unique.length);
unique.forEach((u, i) => console.log(i + 1, u));

const entries = unique.map((src, i) => ({
  id: `airport-diary-${i + 1}`,
  src,
  alt: `AR Group student departure — Airport Diaries ${i + 1}`,
}));

writeFileSync(
  join(__dirname, '../data/airport-diaries.json'),
  JSON.stringify(
    {
      title: 'Airport Diaries',
      subtitle: 'Real moments when our MBBS abroad students begin their global medical journey',
      hubHref: '/mbbs-abroad',
      images: entries,
    },
    null,
    2
  )
);
