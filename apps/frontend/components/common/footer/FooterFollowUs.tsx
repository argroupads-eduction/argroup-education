'use client';

import type { SiteSocialLink } from '@/lib/siteGlobals';

const FOOTER_FOLLOW_ORDER = ['instagram', 'facebook', 'email', 'youtube'] as const;
const EXCLUDED_PLATFORMS = new Set(['linkedin', 'twitter', 'whatsapp']);

type FollowPlatform = (typeof FOOTER_FOLLOW_ORDER)[number];

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 fill-white">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403.59.217 1.01.477 1.45.917.44.44.7.86.917 1.45.163.46.349 1.26.403 2.43.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a3.94 3.94 0 0 1-.917 1.45 3.94 3.94 0 0 1-1.45.917c-.46.163-1.26.349-2.43.403-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a3.94 3.94 0 0 1-1.45-.917 3.94 3.94 0 0 1-.917-1.45c-.163-.46-.349-1.26-.403-2.43C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43.217-.59.477-1.01.917-1.45.44-.44.86-.7 1.45-.917.46-.163 1.26-.349 2.43-.403C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.74 0 8.333.014 7.053.072 5.775.13 4.905.333 4.14.63a6.08 6.08 0 0 0-2.197 1.43A6.08 6.08 0 0 0 .513 4.257C.216 5.022.013 5.892-.045 7.17-.103 8.45-.117 8.857-.117 12c0 3.143.014 3.55.072 4.83.058 1.278.261 2.148.558 2.913a6.08 6.08 0 0 0 1.43 2.197 6.08 6.08 0 0 0 2.197 1.43c.765.297 1.635.5 2.913.558 1.28.058 1.687.072 4.83.072s3.55-.014 4.83-.072c1.278-.058 2.148-.261 2.913-.558a6.08 6.08 0 0 0 2.197-1.43 6.08 6.08 0 0 0 1.43-2.197c.297-.765.5-1.635.558-2.913.058-1.28.072-1.687.072-4.83s-.014-3.55-.072-4.83c-.058-1.278-.261-2.148-.558-2.913a6.08 6.08 0 0 0-1.43-2.197A6.08 6.08 0 0 0 19.743.63C18.978.333 18.108.13 16.83.072 15.55.014 15.143 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 fill-white">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 fill-white">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 fill-white">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function SocialBrandIcon({ platform }: { platform: FollowPlatform }) {
  switch (platform) {
    case 'instagram':
      return <InstagramIcon />;
    case 'facebook':
      return <FacebookIcon />;
    case 'email':
      return <EmailIcon />;
    case 'youtube':
      return <YouTubeIcon />;
    default:
      return null;
  }
}

function platformLabel(platform: FollowPlatform): string {
  switch (platform) {
    case 'instagram':
      return 'Instagram';
    case 'facebook':
      return 'Facebook';
    case 'email':
      return 'Email';
    case 'youtube':
      return 'YouTube';
    default:
      return platform;
  }
}

export function resolveFooterFollowLinks(
  socialLinks: SiteSocialLink[],
  email: string
): { platform: FollowPlatform; url: string }[] {
  const byPlatform = new Map<string, string>();

  for (const link of socialLinks) {
    if (!link.platform || !link.url || EXCLUDED_PLATFORMS.has(link.platform)) continue;
    if (link.platform === 'gmail') {
      byPlatform.set('email', link.url);
    } else {
      byPlatform.set(link.platform, link.url);
    }
  }

  const trimmedEmail = email.trim();
  if (trimmedEmail && !byPlatform.has('email')) {
    byPlatform.set('email', `mailto:${trimmedEmail}`);
  }

  return FOOTER_FOLLOW_ORDER.flatMap((platform) => {
    const url = byPlatform.get(platform);
    return url ? [{ platform, url }] : [];
  });
}

type FooterFollowUsProps = {
  socialLinks: SiteSocialLink[];
  email: string;
};

export function FooterFollowUs({ socialLinks, email }: FooterFollowUsProps) {
  const links = resolveFooterFollowLinks(socialLinks, email);

  return (
    <div className="site-footer-follow site-footer-follow--embedded" aria-label="Follow us on social media">
      <h2 className="site-footer-follow__title">Follow us on</h2>
      <div className="site-footer-follow__icons">
        {links.map((social) => (
          <a
            key={social.platform}
            href={social.url}
            target={social.platform === 'email' ? undefined : '_blank'}
            rel={social.platform === 'email' ? undefined : 'noopener noreferrer'}
            className={`site-footer-follow__icon site-footer-follow__icon--${social.platform}`}
            aria-label={platformLabel(social.platform)}
          >
            <SocialBrandIcon platform={social.platform} />
          </a>
        ))}
      </div>
    </div>
  );
}
