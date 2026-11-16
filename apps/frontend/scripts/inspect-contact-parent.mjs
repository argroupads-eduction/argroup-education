import pages from '../data/wp-export-bundle/pages.json' with { type: 'json' };

const slug = process.argv[2] || 'mbbs-in-up';
const page = pages.find((p) => p.slug === slug);
const idx = page.content.indexOf('Contact Us Now');
const before = page.content.slice(Math.max(0, idx - 3000), idx + 3500);

// find sections/columns with background or color hints near contact
const sections = before.match(/elementor-section[^>]*data-settings="[^"]*"/gi) || [];
console.log('nearby sections with settings:', sections.slice(-5));

const widgets = before.match(/elementor-widget-icon-list[^>]*|elementor-element-dc27e84[^>]*|background[^;]{0,80}/gi) || [];
console.log(widgets.slice(0, 20));

// check if contact is in inner section 50-50
const inner = before.match(/elementor-inner-section[\s\S]{0,4000}Contact Us Now[\s\S]{0,2000}/i);
if (inner) console.log('\ninner context:', inner[0].slice(0, 2500));
