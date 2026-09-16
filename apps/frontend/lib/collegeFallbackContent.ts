import type { SiteContent } from '@/lib/contentApi';
import { resolveCollegeImageUrl } from '@/lib/collegeImageIndex';
import { findCollegeProgramEntry } from '@/lib/collegeProgramLookup';
import { CONTACT_INFO } from '@/lib/constants';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildFallbackHtml(entry: ReturnType<typeof findCollegeProgramEntry>, imageSrc: string): string {
  const name = escapeHtml(entry!.name);
  const region = escapeHtml(entry!.regionName);
  const regionHref = escapeHtml(entry!.regionHref);
  const city = entry!.city ? escapeHtml(entry!.city) : '';
  const programLabel = entry!.program === 'india' ? 'MBBS in India' : 'MBBS Abroad';
  const phone = escapeHtml(CONTACT_INFO.phone);
  const phoneTel = escapeHtml(CONTACT_INFO.phoneTel);

  return `
<section class="elementor-inner-section wp-university-profile">
  <div class="elementor-container elementor-column-gap-default wp-university-profile-grid wp-editorial-split">
    <div class="elementor-column elementor-col-50">
      <div class="elementor-widget-wrap elementor-element-populated">
        <div class="elementor-widget elementor-widget-image">
          <img src="${escapeHtml(imageSrc)}" alt="${name}" width="650" height="420" loading="lazy" decoding="async" />
        </div>
      </div>
    </div>
    <div class="elementor-column elementor-col-50">
      <div class="elementor-widget-wrap elementor-element-populated">
        <h2>${name}</h2>
        <p><strong>${programLabel}</strong>${city ? ` · ${city}` : ''} · ${region}</p>
        <p>AR Group of Education provides end-to-end counselling for admission to <strong>${name}</strong> — eligibility, fees, documents, and visa support for Indian students.</p>
        <p><a href="/contact">Book free counselling</a> · <a href="tel:${phoneTel}">${phone}</a></p>
        <p><a href="${regionHref}">View all colleges in ${region}</a></p>
      </div>
    </div>
  </div>
</section>
<section class="elementor-section">
  <div class="elementor-container">
    <div class="elementor-widget-text-editor">
      <h2>Admission support</h2>
      <p>Our counsellors help you compare ${name} with other NMC-recognised options in ${region}. We assist with application filing, offer letters, and pre-departure guidance.</p>
      <ul>
        <li>NEET eligibility &amp; academic requirements</li>
        <li>Tuition fees and living cost overview</li>
        <li>Document checklist and timeline</li>
        <li>Visa and travel briefing (abroad programs)</li>
      </ul>
      <p>Call <strong>${phone}</strong> or <a href="/contact">submit the enquiry form</a> for a personalised admission roadmap.</p>
    </div>
  </div>
</section>`.trim();
}

/** Synthetic page when a program-tree college has no WP export / CMS document yet. */
export function buildCollegeFallbackContent(slug: string): SiteContent | null {
  const entry = findCollegeProgramEntry(slug);
  if (!entry) return null;

  const featuredImage = resolveCollegeImageUrl(slug, entry.image);
  const imageSrc = featuredImage ?? '/ar-group-logo.png';
  const programLabel = entry.program === 'india' ? 'MBBS India' : 'MBBS Abroad';
  const metaDescription = `${entry.name} — ${programLabel} admission, fees, eligibility and counselling. Contact AR Group of Education.`;

  return {
    id: `fallback-${slug}`,
    type: 'page',
    title: entry.name,
    slug,
    content: buildFallbackHtml(entry, imageSrc),
    excerpt: metaDescription,
    featuredImage: imageSrc,
    metaTitle: `${entry.name} | ${programLabel} Admission`,
    metaDescription,
    canonicalUrl: null,
    ogTitle: entry.name,
    ogDescription: metaDescription,
    ogImage: imageSrc,
    twitterTitle: entry.name,
    twitterDescription: metaDescription,
    publishedAt: null,
    updatedAt: new Date().toISOString(),
  };
}
