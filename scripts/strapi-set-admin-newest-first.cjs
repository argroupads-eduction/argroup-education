/**
 * Set Content Manager default sort: newest publish date first.
 * Local Strapi SQLite only — does not touch live MySQL / website.
 *
 * Usage (Strapi can be running; restart admin page after):
 *   node scripts/strapi-set-admin-newest-first.cjs
 */
const path = require('path');
const Database = require('D:/ar-group-strapi/node_modules/better-sqlite3');

const dbPath = path.join('D:/ar-group-strapi/.tmp/data.db');
const db = new Database(dbPath);

const TARGETS = [
  {
    key: 'plugin_content_manager_configuration_content_types::api::post.post',
    sortBy: 'legacyPublishedAt',
  },
  {
    key: 'plugin_content_manager_configuration_content_types::api::page.page',
    sortBy: 'legacyPublishedAt',
  },
];

for (const { key, sortBy } of TARGETS) {
  const row = db.prepare('SELECT value FROM strapi_core_store_settings WHERE key = ?').get(key);
  if (!row) {
    console.log('skip missing', key);
    continue;
  }
  const cfg = JSON.parse(row.value);
  cfg.settings = cfg.settings || {};
  cfg.settings.defaultSortBy = sortBy;
  cfg.settings.defaultSortOrder = 'DESC';
  cfg.settings.pageSize = Math.max(cfg.settings.pageSize || 10, 25);

  cfg.metadatas = cfg.metadatas || {};
  if (!cfg.metadatas.legacyPublishedAt) {
    cfg.metadatas.legacyPublishedAt = {
      edit: {
        label: 'legacyPublishedAt',
        description: 'Original MySQL publishedAt',
        placeholder: '',
        visible: true,
        editable: true,
      },
      list: { label: 'Published', searchable: false, sortable: true },
    };
  } else {
    cfg.metadatas.legacyPublishedAt.list = {
      ...(cfg.metadatas.legacyPublishedAt.list || {}),
      label: 'Published',
      sortable: true,
    };
  }

  // Prefer showing Published + title + slug in list
  if (Array.isArray(cfg.layouts?.list)) {
    const list = cfg.layouts.list.filter((f) => f !== 'legacyPublishedAt');
    cfg.layouts.list = ['legacyPublishedAt', ...list.filter((f) => f !== 'id')].slice(0, 6);
  }

  db.prepare('UPDATE strapi_core_store_settings SET value = ? WHERE key = ?').run(
    JSON.stringify(cfg),
    key
  );
  console.log('updated', key, '→', sortBy, 'DESC');
}

db.close();
console.log('Done. Hard-refresh Strapi admin (Ctrl+Shift+R). Live site unchanged.');
