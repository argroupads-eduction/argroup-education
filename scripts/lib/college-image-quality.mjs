/** Detect junk / mismatched images for college cards and pick better page images. */

const JUNK_FILENAME_RE =
  /(?:^|\/)(?:untitled(?:-\d+)?(?:-\d+)?|blog-iamge|11699)\.(?:jpe?g|png|webp|gif|avif)(?:$|\?)|mbbs-in-russia|study-mbbs-in-russia|apply-mbbs|studying-mbbs|mbbs-in-abroad|mbbs-russia|mbbs-abroad|mbbs-in-india(?:-\d+)?|pleased-young-female-doctor|smiling-young-female-doctor|young-female-doctor|doctor-with-thumbs|front-view-nurses|portrait-young-female-doctor|portrait-profession-practice|high-angle-graduated|outdoor-portrait-serious|medics-looking-cardiogram|reasons-to-study-mbbs|apply-mbbs-in-russia|(?:^|\/)up\.png(?:$|\?)|(?:^|\/)mp(?:-|\.)/i;

const LOGO_FILENAME_RE =
  /(?:^|\/)(?:logo|emblem|seal|symbol|badge|icon|favicon|caduceus|crest|monogram)(?:[-_.]|$)|[-_](?:logo|emblem|seal)(?:[-_.]|\.)/i;

const CAMPUS_FILENAME_RE =
  /campus|building|hospital|college-|institute-|university-|aerial|facade|front-view|main-block|block-|hostel|infrastructure|whatsapp-image|exterior|view-/i;

const STOP_FILENAME_TOKENS = new Set([
  'medical',
  'college',
  'institute',
  'university',
  'hospital',
  'sciences',
  'science',
  'research',
  'center',
  'centre',
  'state',
  'national',
  'international',
  'private',
  'mbbs',
  'india',
  'abroad',
  'russia',
  'nepal',
  'china',
  'georgia',
  'kazakhstan',
  'kyrgyzstan',
  'bangladesh',
  'uzbekistan',
  'fees',
  'admission',
  'cutoff',
  'counselling',
  'counseling',
  'students',
  'student',
  'campus',
  'banner',
  'cover',
  'home',
  'page',
  'scaled',
  'webp',
  'jpg',
  'jpeg',
  'png',
  'image',
  'photo',
  'thumb',
  'elementor',
  'uploads',
  'whatsapp',
]);

/** Known wrong pairings: filename token → slug must contain one of these */
const FOREIGN_COLLEGE_TOKENS = {
  kasturba: ['manipal', 'kasturba'],
  manipal: ['manipal', 'kasturba'],
  aiims: ['aiims', 'delhi'],
  'all-india': ['aiims', 'delhi'],
};

export function normImagePath(url) {
  return String(url || '')
    .toLowerCase()
    .replace(/^https?:\/\/(?:www\.)?argroupofeducation\.com/i, '')
    .replace(/^\/api\/wp-media\/uploads\//i, '/wp-content/uploads/')
    .split('?')[0];
}

export function slugFilenameTokens(slug) {
  return String(slug || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOP_FILENAME_TOKENS.has(t));
}

export function isLogoCollegeImage(url) {
  if (!url?.trim()) return false;
  const path = normImagePath(url);
  if (/\/uploads\/colleges\/[^/]+\.png$/i.test(path)) return true;
  if (LOGO_FILENAME_RE.test(path)) return true;
  if (/-\d+x\d+\./i.test(path) && /(?:150|200|300)x(?:150|200|300)/i.test(path)) return true;
  return false;
}

export function isMismatchedCollegeImage(url, slug) {
  if (!url || !slug) return false;
  const file = normImagePath(url).split('/').pop() || '';
  const slugNorm = String(slug).toLowerCase();
  for (const [foreign, required] of Object.entries(FOREIGN_COLLEGE_TOKENS)) {
    if (!file.includes(foreign)) continue;
    if (!required.some((t) => slugNorm.includes(t))) return true;
  }
  return false;
}

export function isJunkCollegeImage(url, slug) {
  if (!url?.trim()) return true;
  const path = normImagePath(url);
  if (!path || /\.svg(?:$|\?)/i.test(path)) return true;
  if (JUNK_FILENAME_RE.test(path)) return true;
  if (/\/elementor\/thumbs\/Untitled/i.test(path)) return true;
  if (isMismatchedCollegeImage(url, slug)) return true;
  if (
    /\/\d{4}\/\d{2}\/(?:up|mp|bihar|kerala|rajasthan|haryana|karnataka|maharashtra|delhi|tamil-nadu|west-bengal|uttarakhand|himachal|pondicherry|chhattisgarh|jharkhand|sikkim)\.(?:png|jpe?g|webp)$/i.test(
      path
    )
  ) {
    return true;
  }
  return false;
}

export function elementorThumbPrefix(filename) {
  const match = String(filename).match(/^(.+)-[a-z0-9]{16,}\.(jpe?g|png|webp|gif|avif)$/i);
  return match ? match[1].toLowerCase() : null;
}

export function scoreCollegeImage(url, slug) {
  if (!url || isJunkCollegeImage(url, slug)) return -1;
  const path = normImagePath(url);
  const file = path.split('/').pop() || '';
  const tokens = slugFilenameTokens(slug);

  let score = 0;

  if (isLogoCollegeImage(url)) score -= 20;
  if (CAMPUS_FILENAME_RE.test(file)) score += 8;
  if (/whatsapp-image/i.test(file)) score += 6;
  if (/\/uploads\/20\d{2}\/\d{2}\//i.test(path)) score += 3;

  for (const token of tokens) {
    if (file.includes(token)) score += 5;
  }

  const thumbPrefix = elementorThumbPrefix(file);
  if (thumbPrefix) {
    for (const token of tokens) {
      if (thumbPrefix.includes(token)) score += 4;
    }
    score += 2;
  }

  if (/\/colleges\//i.test(path)) score -= 8;
  if (/banner_image/i.test(file)) score += 2;
  if (/-\d+x\d+\./i.test(file) && /(?:1024|768|650|800)/i.test(file)) score += 2;
  if (/-\d+x\d+\./i.test(file) && /(?:150|200)x/i.test(file)) score -= 4;

  if (tokens.length >= 2 && score < 2 && !/whatsapp-image/i.test(file) && !thumbPrefix) return -1;
  if (score < 1) return -1;
  return score;
}

export function extractContentImages(html) {
  if (!html) return [];
  const urls = new Set();
  const patterns = [
    /<img\b[^>]*\bsrc=["']([^"']+)["']/gi,
    /<img\b[^>]*\bdata-src=["']([^"']+)["']/gi,
    /url\((['"]?)(\/wp-content\/uploads\/[^'")]+)\1\)/gi,
    /(https?:\/\/(?:www\.)?argroupofeducation\.com\/wp-content\/uploads\/[^"'\\s)]+)/gi,
    /(\/wp-content\/uploads\/[^"'\\s)]+)/gi,
  ];

  for (const re of patterns) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(html))) {
      const raw = match[1] || match[2];
      if (!raw || raw.includes('submit-spin') || raw.includes('wpforms')) continue;
      if (raw.length < 12 || raw.endsWith('/thumb')) continue;
      urls.add(raw);
    }
  }

  return [...urls];
}

export function pickCollegePageImage(slug, featuredImage, contentHtml) {
  const candidates = [];
  if (featuredImage) candidates.push(featuredImage);
  for (const url of extractContentImages(contentHtml)) candidates.push(url);

  let best = null;
  let bestScore = -1;
  const seen = new Set();

  for (const url of candidates) {
    const key = normImagePath(url);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const score = scoreCollegeImage(url, slug);
    if (score > bestScore) {
      bestScore = score;
      best = url;
    }
  }

  return bestScore >= 2 ? best : null;
}
