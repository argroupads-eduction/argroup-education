import pages from '../data/wp-export-bundle/pages.json' with { type: 'json' };

const slug = process.argv[2] || 'mbbs-in-up';
const page = pages.find((p) => p.slug === slug);
const styles = page.content.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
console.log('style blocks:', styles.length);
for (const s of styles.slice(0, 3)) {
  const colors = s.match(/color:[^;}+]+/gi) || [];
  console.log('\n--- snippet ---');
  console.log(s.slice(0, 800));
  console.log('colors:', colors.slice(0, 10));
}

const whiteRules = page.content.match(/color:\s*#fff[^;]*/gi) || [];
console.log('\nwhite color rules in content:', whiteRules.length);
console.log(whiteRules.slice(0, 15));
