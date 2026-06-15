/** Runtime guards for college card / profile images (keep in sync with scripts/lib/college-image-quality.mjs). */

const JUNK_FILENAME_RE =
  /(?:^|\/)(?:untitled(?:-\d+)?(?:-\d+)?|blog-iamge|11699)\.(?:jpe?g|png|webp|gif|avif)(?:$|\?)|mbbs-in-russia|study-mbbs-in-russia|apply-mbbs|studying-mbbs|mbbs-in-abroad|mbbs-russia|mbbs-abroad|mbbs-in-india(?:-\d+)?|pleased-young-female-doctor|smiling-young-female-doctor|young-female-doctor|doctor-with-thumbs|front-view-nurses|portrait-young-female-doctor|portrait-profession-practice|high-angle-graduated|outdoor-portrait-serious|medics-looking-cardiogram|reasons-to-study-mbbs|apply-mbbs-in-russia|(?:^|\/)up\.png(?:$|\?)|(?:^|\/)mp(?:-|\.)/i;

const LOGO_FILENAME_RE =
  /(?:^|\/)(?:logo|emblem|seal|symbol|badge|icon|favicon|caduceus|crest|monogram)(?:[-_.]|$)|[-_](?:logo|emblem|seal)(?:[-_.]|\.)/i;

const FOREIGN_COLLEGE_TOKENS: Record<string, string[]> = {
  kasturba: ['manipal', 'kasturba'],
  manipal: ['manipal', 'kasturba'],
  aiims: ['aiims', 'delhi'],
  'all-india': ['aiims', 'delhi'],
};

function normImagePath(url: string): string {
  return String(url || '')
    .toLowerCase()
    .replace(/^https?:\/\/(?:www\.)?argroupofeducation\.com/i, '')
    .replace(/^\/api\/wp-media\/uploads\//i, '/wp-content/uploads/')
    .split('?')[0];
}

function isLogoCollegeImage(url: string): boolean {
  const path = normImagePath(url);
  if (/\/uploads\/colleges\/[^/]+\.png$/i.test(path)) return false;
  if (LOGO_FILENAME_RE.test(path)) return true;
  return false;
}

function isMismatchedCollegeImage(url: string, slug?: string | null): boolean {
  if (!slug) return false;
  const file = normImagePath(url).split('/').pop() || '';
  const slugNorm = slug.toLowerCase();
  for (const [foreign, required] of Object.entries(FOREIGN_COLLEGE_TOKENS)) {
    if (!file.includes(foreign)) continue;
    if (!required.some((t) => slugNorm.includes(t))) return true;
  }
  return false;
}

export function isJunkCollegeImage(url: string | null | undefined, slug?: string | null): boolean {
  if (!url?.trim()) return true;
  const path = normImagePath(url);
  if (!path || /\.svg(?:$|\?)/i.test(path)) return true;
  if (JUNK_FILENAME_RE.test(path)) return true;
  if (/\/elementor\/thumbs\/Untitled/i.test(path)) return true;
  if (isMismatchedCollegeImage(url, slug)) return true;
  if (
    slug &&
    /\/\d{4}\/\d{2}\/(?:up|mp|bihar|kerala|rajasthan|haryana|karnataka|maharashtra|delhi|tamil-nadu|west-bengal|uttarakhand|himachal|pondicherry|chhattisgarh|jharkhand|sikkim)\.(?:png|jpe?g|webp)$/i.test(
      path
    )
  ) {
    return true;
  }
  return false;
}
