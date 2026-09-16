import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { getPayload } from 'payload';
import config from '@payload-config';

async function main() {
  const pages = JSON.parse(
    await readFile('../apps/frontend/data/wp-export-bundle/pages.json', 'utf8')
  );
  const item = pages.find((p: { slug: string }) => p.slug === 'mbbs-in-kerala');
  const payload = await getPayload({ config });

  try {
    await payload.create({
      collection: 'pages',
      data: {
        title: item.title,
        slug: `${item.slug}-test-import-${Date.now()}`,
        htmlContent: item.content,
        hero: { type: 'none' },
        layout: [],
        meta: { title: item.title, description: 'test' },
        _status: 'published',
      },
      overrideAccess: true,
      context: { disableRevalidate: true, disableBackendSync: true },
    });
    console.log('ok');
  } catch (e: unknown) {
    const err = e as { data?: { errors?: unknown }; errors?: unknown; message?: string };
    console.error(JSON.stringify(err?.data?.errors ?? err?.errors ?? err?.message ?? err, null, 2));
  }
}

main();
