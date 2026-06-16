export type SiteLink = { label: string; href: string };

export type SiteSocialLink = { platform: string; url: string };

export type SiteContactInfo = {
  phone?: string;
  phoneTel?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  hours?: string;
};

export type FooterGlobalData = {
  companyLinks?: SiteLink[];
  programLinks?: SiteLink[];
};

export type SiteSettingsGlobalData = SiteContactInfo & {
  socialLinks?: SiteSocialLink[];
  defaultMetaTitle?: string;
  defaultMetaDescription?: string;
  defaultOgImageUrl?: string;
};

export type SiteGlobalsBundle = {
  footer: FooterGlobalData | null;
  'site-settings': SiteSettingsGlobalData | null;
};

export function mergeLinkLists(
  fallback: readonly SiteLink[],
  cms?: SiteLink[] | null
): SiteLink[] {
  if (!cms?.length) return [...fallback];
  const seen = new Set(cms.map((l) => l.href));
  const extras = fallback.filter((l) => !seen.has(l.href));
  return [...cms, ...extras];
}

export function mergeContactInfo(
  fallback: SiteContactInfo,
  cms?: SiteContactInfo | null
): SiteContactInfo {
  if (!cms) return fallback;
  return {
    phone: cms.phone?.trim() || fallback.phone,
    phoneTel: cms.phoneTel?.trim() || fallback.phoneTel,
    email: cms.email?.trim() || fallback.email,
    whatsapp: cms.whatsapp?.trim() || fallback.whatsapp,
    address: cms.address?.trim() || fallback.address,
    hours: cms.hours?.trim() || fallback.hours,
  };
}

export function mergeSocialLinks(
  fallback: readonly SiteSocialLink[],
  cms?: SiteSocialLink[] | null
): SiteSocialLink[] {
  if (!cms?.length) return [...fallback];
  const byPlatform = new Map(fallback.map((s) => [s.platform, s]));
  for (const link of cms) {
    if (link.platform && link.url) byPlatform.set(link.platform, link);
  }
  return [...byPlatform.values()];
}
