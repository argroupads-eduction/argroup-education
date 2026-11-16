import { readFileSync } from 'node:fs';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
const h = pages.find((x) => x.slug === 'study-mbbs-in-abroad').content;
const re = /<section\b([^>]*\belementor-top-section\b[^>]*)>([\s\S]*?)<\/section>/gi;
let m;
let i = 0;
while ((m = re.exec(h)) !== null) {
  const inner = m[2];
  const imgs = (inner.match(/<img\b/gi) || []).length;
  const mbbs = (inner.match(/MBBS\s+IN/gi) || []).length;
  const icons = (inner.match(/elementor-icon-box/gi) || []).length;
  const text = inner.replace(/<[^>]+>/g, ' ').slice(0, 200);
  if (imgs >= 2 || icons >= 2 || /document|affordable|mbbs in/i.test(inner)) {
    console.log({ i, imgs, mbbs, icons, snippet: text.slice(0, 120) });
  }
  i++;
}
console.log('top sections', i);
