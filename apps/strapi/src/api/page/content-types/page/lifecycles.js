'use strict';

async function loadPrior(event) {
  event.state = event.state || {};
  try {
    const where = event.params?.where || {};
    if (!where || Object.keys(where).length === 0) {
      event.state.wasPublished = false;
      event.state.prior = null;
      return null;
    }
    const prior = await strapi.db.query('api::page.page').findOne({ where });
    event.state.wasPublished = prior?.publishedAt != null;
    event.state.prior = prior || null;
    return prior;
  } catch {
    event.state.wasPublished = false;
    event.state.prior = null;
    return null;
  }
}

function sanitizeSlug(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s/-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function applySlugSanitize(event) {
  const data = event.params?.data;
  if (!data || typeof data !== 'object') return;
  if (typeof data.slug === 'string' && data.slug.trim()) {
    const clean = sanitizeSlug(data.slug);
    if (clean) data.slug = clean;
  }
}

module.exports = {
  async beforeCreate(event) {
    applySlugSanitize(event);
  },
  async beforeUpdate(event) {
    await loadPrior(event);
    applySlugSanitize(event);
  },
  // Marketing sync only via documents middleware — avoid draft afterUpdate unpublish race.
  async afterCreate() {},
  async afterUpdate() {},
  async beforeDelete(event) {
    await loadPrior(event);
  },
  async afterDelete() {},
};
