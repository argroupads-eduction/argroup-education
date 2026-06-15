const STOP_WORDS = new Set([
  'medical',
  'college',
  'institute',
  'institution',
  'hospital',
  'sciences',
  'science',
  'and',
  'the',
  'of',
  'for',
  'in',
  'a',
  'an',
  'university',
  'research',
  'center',
  'centre',
  'school',
  'academy',
  'campus',
  'mbbs',
  'state',
  'national',
  'international',
  'private',
  'deemed',
  'trust',
  'ltd',
  'limited',
]);

/** Known display-name → WP slug overrides (typos / legacy labels). */
const COLLEGE_SLUG_OVERRIDES = new Map([
  ['ajay sangal institute of medical sciences', 'ajay-sangaal-institute-of-medical-sciences'],
  ['peoples college of medical science', 'peoples-college-of-medical-sciences'],
  ['peoples college of medical sciences', 'peoples-college-of-medical-sciences'],
  ['rps college of veterinary animal sciences', 'rps-college-of-veterinary-sciences'],
  ['national institute of medical sciences research', 'national-institute-of-medical-sciences-and-research-jaipur'],
  ['s nijalingappa medical college and hsk hospital', 's-nijalingappa-medical-college-and-h-s-k-hospital'],
  ['amaltas institute of medical science', 'amaltas-institute-of-medical-science'],
  ['chirayu medical college and hospital', 'chirayu-medical-college-bhopal'],
  ['college of medical science', 'college-of-medical-science-bharatpur'],
  ['belgorod state university russia', 'belgorod-state-university-russia'],
]);

export function extractFirstContentImage(html) {
  if (!html) return null;
  const hero = html.match(
    /elementor-widget-image[\s\S]{0,1200}?<img[^>]+src=["']([^"']+)["']/i
  );
  return hero?.[1] ?? null;
}

export function normCollegeText(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]/g, ' $1 ')
    .replace(/&[^;]+;/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function expandAbbreviations(name) {
  return String(name || '')
    .replace(/\b([A-Za-z])\s*\.\s*([A-Za-z])\s*\./g, '$1$2')
    .replace(/\b([A-Za-z])\s*\./g, '$1');
}

export function significantTokens(name) {
  const key = normCollegeText(expandAbbreviations(name));
  return [...new Set(key.split(' ').filter((w) => w.length >= 2 && !STOP_WORDS.has(w)))];
}

function slugMatchesToken(slug, token) {
  const s = normCollegeText(slug);
  if (!token) return false;
  if (s.includes(token)) return true;
  if (token.length >= 2) {
    const dashed = token.split('').join('-');
    if (s.includes(dashed)) return true;
  }
  return false;
}

function scorePageMatch(collegeName, city, page) {
  const nameKey = normCollegeText(expandAbbreviations(collegeName));
  const titleKey = normCollegeText(page.title);
  if (!nameKey) return 0;

  if (titleKey === nameKey) {
    if (!city) return 1000;
  } else if (!city) {
    const shorter = Math.min(titleKey.length, nameKey.length);
    const longer = Math.max(titleKey.length, nameKey.length);
    if (shorter > 0 && longer > 0) {
      const contained = titleKey.includes(nameKey) || nameKey.includes(titleKey);
      if (contained && shorter / longer >= 0.72) return 500 + shorter;
    }
  }

  if (titleKey === nameKey && city) {
    const cityNorm = normCollegeText(city);
    if (cityNorm.length >= 3) {
      const cityInPage = titleKey.includes(cityNorm) || slugMatchesToken(page.slug, cityNorm);
      if (cityInPage) return 1000;
      return 0;
    }
    return 1000;
  }

  const tokens = significantTokens(collegeName);
  if (!tokens.length) return 0;

  let score = 0;
  let nameTokenHits = 0;
  for (const token of tokens) {
    if (titleKey.split(' ').includes(token)) {
      score += 4;
      nameTokenHits += 1;
    } else if (titleKey.includes(token)) {
      score += 2;
      nameTokenHits += 1;
    }
    if (slugMatchesToken(page.slug, token)) {
      score += 2;
      nameTokenHits += 1;
    }
  }

  if (nameTokenHits === 0) return 0;

  if (city) {
    const cityNorm = normCollegeText(city);
    if (cityNorm.length >= 3) {
      const cityInPage = titleKey.includes(cityNorm) || slugMatchesToken(page.slug, cityNorm);
      if (cityInPage) score += 20;
      else score -= 30;
    }
  }

  const minRequired = tokens.length >= 2 ? 8 : 6;
  return score >= minRequired ? score : 0;
}

/** Match a college display name (+ optional city) to the best WP page slug. */
export function findCollegePageSlug(collegeName, pages, city) {
  const overrideKey = normCollegeText(expandAbbreviations(collegeName));
  const override = COLLEGE_SLUG_OVERRIDES.get(overrideKey);
  if (override) return override;

  let best = null;
  let bestScore = 0;

  for (const page of pages) {
    const score = scorePageMatch(collegeName, city, page);
    if (score > bestScore) {
      bestScore = score;
      best = page.slug;
    }
  }

  return best;
}
