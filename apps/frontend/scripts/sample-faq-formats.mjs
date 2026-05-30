import { readFileSync } from 'fs';

const pages = JSON.parse(readFileSync('./data/wp-export-bundle/pages.json', 'utf8'));
const posts = JSON.parse(readFileSync('./data/wp-export-bundle/posts.json', 'utf8'));
for (const doc of [...pages, ...posts]) {
  if (doc.content?.includes('schema-faq-section')) {
    console.log('yoast', doc.slug);
    console.log(doc.content.slice(doc.content.indexOf('schema-faq'), doc.content.indexOf('schema-faq') + 800));
    break;
  }
}
for (const doc of [...pages, ...posts]) {
  if (doc.content?.includes('essential-blocks-accordion')) {
    console.log('eb', doc.slug);
    console.log(doc.content.slice(doc.content.indexOf('essential-blocks'), doc.content.indexOf('essential-blocks') + 1200));
    break;
  }
}
