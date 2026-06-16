import { readFileSync } from 'fs';
import { prepareWpHtml } from '../lib/wpHtmlPrepare.ts';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
let iconIssues = 0;
let jkitIssues = 0;
let contactIssues = 0;

for (const doc of pages) {
  const out = prepareWpHtml(doc.content || '');
  const hasIconList = /elementor-icon-list/i.test(out);
  if (!hasIconList) continue;

  const brokenIconStack =
    /<li[^>]*elementor-icon-list-item[^>]*>[\s\S]*?<span class="elementor-icon-list-icon"[\s\S]*?<\/span>\s*<\/li>\s*<li/i.test(
      out
    ) ||
    /<ul[^>]*>[\s\S]*?<li[^>]*>[\s\S]*?elementor-icon-list-icon[\s\S]*?<\/li>[\s\S]*?<li[^>]*>[\s\S]*?elementor-icon-list-text/i.test(
      out
    );

  const iconInChip = /wp-premium-icon-chip-grid[\s\S]{0,2000}elementor-icon-list-icon/.test(out);
  const splitIconText = /elementor-icon-list-icon[\s\S]{0,80}<\/span>\s*<\/li>\s*<li[^>]*>[\s\S]*?elementor-icon-list-text/.test(out);

  if (iconInChip && /elementor-icon-list-icon/.test(out)) {
    const stacked = /<span class="elementor-icon-list-icon"[^>]*>[\s\S]*?<\/span>\s*<\/li>/.test(out) &&
      !/<li[^>]*elementor-icon-list-item[^>]*>[\s\S]*?elementor-icon-list-icon[\s\S]*?elementor-icon-list-text/.test(out);
    if (stacked) {
      iconIssues++;
      if (iconIssues <= 8) console.log('ICON', doc.slug);
    }
  }

  if (/Get Consultation/i.test(out) && /jkit-image-box|image-box-header/.test(out)) {
    jkitIssues++;
  }
  if (/Contact Us Now!/i.test(out)) contactIssues++;
}

console.log({ total: pages.length, iconIssues, jkitIssues, contactIssues });
