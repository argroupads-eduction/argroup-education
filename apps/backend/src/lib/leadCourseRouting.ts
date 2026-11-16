/** Google Sheet tab names — one tab per programme. */
export const COURSE_SHEET_NAMES = {
  MBBS_INDIA: 'MBBS INDIA',
  MBBS_ABROAD: 'MBBS ABROAD',
  MD_MS: 'MD/MS',
  BAMS: 'BAMS',
} as const;

export type CourseSheetName = (typeof COURSE_SHEET_NAMES)[keyof typeof COURSE_SHEET_NAMES];

/** Countries from MBBS Abroad hero + lead popup dropdowns (and common site destinations). */
export const MBBS_ABROAD_COUNTRY_NAMES = [
  'Russia',
  'Nepal',
  'Uzbekistan',
  'Kazakhstan',
  'Georgia',
  'Kyrgyzstan',
  'Bangladesh',
  'Philippines',
  'Armenia',
  'Belarus',
  'Egypt',
  'Moldova',
  'Tajikistan',
  'Ukraine',
  'Vietnam',
] as const;

const ABROAD_COUNTRY_SET = new Set(
  MBBS_ABROAD_COUNTRY_NAMES.map((c) => c.toLowerCase())
);

export type LeadRoutingInput = {
  source: string;
  formName?: string;
  pageUrl?: string;
  fields: Record<string, unknown>;
};

function pickField(fields: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = fields[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[\s_]+/g, '-');
}

function isAbroadCountryName(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v || v === 'mbbs abroad' || v === 'abroad') return false;
  return ABROAD_COUNTRY_SET.has(v);
}

function sheetFromSlugToken(token: string): CourseSheetName | null {
  const t = normalizeToken(token);
  if (t.includes('mbbs-india') || t === 'india' || t === 'mbbs-india') {
    return COURSE_SHEET_NAMES.MBBS_INDIA;
  }
  if (t.includes('mbbs-abroad') || t === 'abroad' || t === 'mbbs-abroad') {
    return COURSE_SHEET_NAMES.MBBS_ABROAD;
  }
  if (t.includes('md-ms') || t.includes('md/ms') || t === 'md-ms') {
    return COURSE_SHEET_NAMES.MD_MS;
  }
  if (t.includes('bams')) {
    return COURSE_SHEET_NAMES.BAMS;
  }
  return null;
}

function sheetFromLabel(label: string): CourseSheetName | null {
  const l = label.trim().toLowerCase();
  if (l === 'mbbs india' || l === 'mbbs in india') return COURSE_SHEET_NAMES.MBBS_INDIA;
  if (l === 'mbbs abroad' || l === 'mbbs abroad (any country)') {
    return COURSE_SHEET_NAMES.MBBS_ABROAD;
  }
  if (l === 'md/ms' || l === 'md ms' || l === 'md-ms') return COURSE_SHEET_NAMES.MD_MS;
  if (l === 'bams') return COURSE_SHEET_NAMES.BAMS;
  if (isAbroadCountryName(label)) return COURSE_SHEET_NAMES.MBBS_ABROAD;
  return null;
}

/** Resolve programme sheet + abroad country from form fields and page context. */
export function resolveLeadCourseSheet(input: LeadRoutingInput): {
  sheetName: CourseSheetName;
  country: string;
  courseLabel: string;
} {
  const fields = input.fields;
  const source = input.source.toLowerCase();
  const pageUrl = (input.pageUrl ?? '').toLowerCase();

  const targetCountry = pickField(fields, [
    'targetCountry',
    'target_country',
    'countryPreference',
    'country',
    'state',
  ]);
  const counsellingInterest = pickField(fields, [
    'counsellingInterest',
    'counselling_interest',
    'program',
    'course',
    'studyTrack',
  ]);
  const explicitCourse = pickField(fields, ['course', 'program', 'counsellingInterest']);

  let country = '';
  if (isAbroadCountryName(targetCountry)) {
    country = targetCountry;
  } else if (isAbroadCountryName(explicitCourse)) {
    country = explicitCourse;
  } else if (isAbroadCountryName(counsellingInterest)) {
    country = counsellingInterest;
  }

  const candidates: (CourseSheetName | null)[] = [];

  if (targetCountry) {
    const fromTarget = sheetFromLabel(targetCountry);
    if (fromTarget) candidates.push(fromTarget);
  }

  if (counsellingInterest) {
    candidates.push(sheetFromSlugToken(counsellingInterest));
    candidates.push(sheetFromLabel(counsellingInterest));
  }

  if (explicitCourse) {
    candidates.push(sheetFromSlugToken(explicitCourse));
    candidates.push(sheetFromLabel(explicitCourse));
  }

  candidates.push(sheetFromSlugToken(source));

  if (pageUrl.includes('/mbbs-abroad')) candidates.push(COURSE_SHEET_NAMES.MBBS_ABROAD);
  if (pageUrl.includes('/mbbs-india')) candidates.push(COURSE_SHEET_NAMES.MBBS_INDIA);
  if (pageUrl.includes('/md-ms')) candidates.push(COURSE_SHEET_NAMES.MD_MS);
  if (pageUrl.includes('/bams')) candidates.push(COURSE_SHEET_NAMES.BAMS);

  const abroadSlug = pageUrl.match(/\/mbbs-abroad\/([a-z0-9-]+)/)?.[1];
  if (abroadSlug) {
    candidates.push(COURSE_SHEET_NAMES.MBBS_ABROAD);
    if (!country) {
      country = abroadSlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  const sheetName =
    candidates.find((c): c is CourseSheetName => c !== null) ?? COURSE_SHEET_NAMES.MBBS_INDIA;

  let courseLabel = explicitCourse || counsellingInterest || targetCountry;
  if (!courseLabel) {
    courseLabel =
      sheetName === COURSE_SHEET_NAMES.MBBS_INDIA
        ? 'MBBS India'
        : sheetName === COURSE_SHEET_NAMES.MBBS_ABROAD
          ? 'MBBS Abroad'
          : sheetName;
  }

  if (sheetName === COURSE_SHEET_NAMES.MBBS_ABROAD && country) {
    courseLabel = `MBBS Abroad - ${country}`;
  }

  return { sheetName, country, courseLabel };
}
