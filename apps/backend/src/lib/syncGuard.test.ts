import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  htmlRichness,
  pickFeaturedImage,
  pickRicherSchema,
  pickRicherText,
  resolvePublishedAtForSync,
  resolveSyncImageUrl,
} from './syncGuard';

describe('syncGuard richness', () => {
  it('non-empty beats empty for text', () => {
    assert.equal(pickRicherText('', 'Hello SEO', 'text'), 'Hello SEO');
    assert.equal(pickRicherText('  ', 'Hello SEO', 'text'), 'Hello SEO');
    assert.equal(pickRicherText('New', '', 'text'), 'New');
  });

  it('longer HTML beats shorter plain text', () => {
    const rich = '<h2>A</h2><p>' + 'word '.repeat(80) + '</p><ul><li>1</li></ul>';
    const thin = 'short plain';
    assert.equal(pickRicherText(thin, rich, 'html'), rich);
    assert.ok(htmlRichness(rich) > htmlRichness(thin) * 1.15);
  });

  it('allows intentional edit when incoming is similarly rich', () => {
    const a = '<p>' + 'alpha '.repeat(40) + '</p>';
    const b = '<p>' + 'bravo '.repeat(42) + '</p>';
    assert.equal(pickRicherText(b, a, 'html'), b);
  });

  it('schemaJson: empty never replaces richer', () => {
    const rich = { '@type': 'Article', headline: 'X', description: 'Y'.repeat(50) };
    assert.deepEqual(pickRicherSchema(null, rich), rich);
    assert.deepEqual(pickRicherSchema({}, rich), rich);
  });

  it('schemaJson: parses string incoming (no double-encode)', () => {
    const obj = { '@type': 'Article', headline: 'X' };
    const picked = pickRicherSchema(JSON.stringify(obj), null);
    assert.equal(typeof picked, 'object');
    assert.deepEqual(picked, obj);
  });
});

describe('syncGuard images', () => {
  it('absolutizes /uploads/ with PUBLIC_URL', () => {
    assert.equal(
      resolveSyncImageUrl('/uploads/foo.jpg', { publicUrl: 'http://127.0.0.1:1337' }),
      'http://127.0.0.1:1337/uploads/foo.jpg'
    );
  });

  it('rejects relative non-uploads (would hit www)', () => {
    assert.equal(resolveSyncImageUrl('/images/foo.webp', { publicUrl: 'http://127.0.0.1:1337' }), null);
    assert.equal(resolveSyncImageUrl('images/foo.webp', { publicUrl: 'http://127.0.0.1:1337' }), null);
  });

  it('empty incoming keeps existing featuredImage', () => {
    assert.equal(
      pickFeaturedImage('', 'https://cdn.example/a.jpg', { publicUrl: 'http://127.0.0.1:1337' }),
      'https://cdn.example/a.jpg'
    );
  });
});

describe('syncGuard publishedAt', () => {
  it('keeps existing publishedAt on re-publish when no legacy date', () => {
    const existing = new Date('2024-01-15T10:00:00.000Z');
    const got = resolvePublishedAtForSync({
      isNew: false,
      existingPublishedAt: existing,
      incomingPublishedAt: '2026-10-01T00:00:00.000Z',
      legacyPublishedAt: null,
      published: true,
    });
    assert.equal(got?.toISOString(), existing.toISOString());
  });

  it('honors legacyPublishedAt even on existing posts', () => {
    const existing = new Date('2024-01-15T10:00:00.000Z');
    const got = resolvePublishedAtForSync({
      isNew: false,
      existingPublishedAt: existing,
      incomingPublishedAt: '2026-10-01T00:00:00.000Z',
      legacyPublishedAt: '2023-05-01T00:00:00.000Z',
      published: true,
    });
    assert.equal(got?.toISOString(), '2023-05-01T00:00:00.000Z');
  });

  it('on create prefers legacyPublishedAt', () => {
    const got = resolvePublishedAtForSync({
      isNew: true,
      existingPublishedAt: null,
      incomingPublishedAt: '2026-10-01T00:00:00.000Z',
      legacyPublishedAt: '2023-05-01T00:00:00.000Z',
      published: true,
    });
    assert.equal(got?.toISOString(), '2023-05-01T00:00:00.000Z');
  });
});
