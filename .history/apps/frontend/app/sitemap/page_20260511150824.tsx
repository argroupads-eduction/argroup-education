import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sitemap - AR Group of Education',
};

export default function SitemapPage() {
  const sitemap = [
    { category: 'Main Pages', links: [
      { title: 'Home', href: '/' },
      { title: 'About Us', href: '/about' },
      { title: 'Services', href: '/services' },
      { title: 'Contact', href: '/contact' },
    ]},
    { category: 'Education Paths', links: [
      { title: 'MBBS Abroad', href: '/countries' },
      { title: 'Countries', href: '/countries' },
      { title: 'Universities', href: '/universities' },
      { title: 'Scholarships', href: '/services' },
    ]},
    { category: 'Resources', links: [
      { title: 'Blog', href: '/blog' },
      { title: 'FAQs', href: '/' },
      { title: 'Success Stories', href: '/' },
      { title: 'Gallery', href: '/' },
    ]},
    { category: 'Legal', links: [
      { title: 'Privacy Policy', href: '/privacy' },
      { title: 'Terms & Conditions', href: '/terms' },
      { title: 'Disclaimer', href: '/disclaimer' },
    ]},
  ];

  return (
    <div className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-navy-900 mb-12">
          Sitemap
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {sitemap.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-lg font-bold text-navy-900 mb-4">
                {section.category}
              </h2>
              <ul className="space-y-2">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.href}
                      className="text-gray-600 hover:text-gold-500 transition-colors"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
