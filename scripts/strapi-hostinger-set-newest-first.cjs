/**
 * Set Hostinger Strapi Content Manager sort: legacyPublishedAt DESC (2026 on top).
 * Uses CMS MySQL over srv host (Remote MySQL must allow your IP) OR fails with clear message.
 *
 * Usage:
 *   node scripts/strapi-hostinger-set-newest-first.cjs
 */
const path = require('path');
const mysql = require(
  path.join('D:/ar-group-strapi/node_modules/mysql2/promise')
);

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

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'srv1192.hstgr.io',
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USERNAME || 'u559193891_cmsstrapi',
    password: process.env.DATABASE_PASSWORD || 'ArgroupCms2026Db',
    database: process.env.DATABASE_NAME || 'u559193891_strapi',
    connectTimeout: 20000,
  });

  for (const { key, sortBy } of TARGETS) {
    const [rows] = await conn.query(
      'SELECT id, value FROM strapi_core_store_settings WHERE `key` = ? LIMIT 1',
      [key]
    );
    if (!rows.length) {
      console.log('skip missing', key);
      continue;
    }
    const cfg = JSON.parse(rows[0].value);
    cfg.settings = cfg.settings || {};
    cfg.settings.defaultSortBy = sortBy;
    cfg.settings.defaultSortOrder = 'DESC';
    cfg.settings.pageSize = Math.max(cfg.settings.pageSize || 10, 25);

    cfg.metadatas = cfg.metadatas || {};
    cfg.metadatas.legacyPublishedAt = cfg.metadatas.legacyPublishedAt || {
      edit: {
        label: 'legacyPublishedAt',
        description: 'Original publish date',
        placeholder: '',
        visible: true,
        editable: true,
      },
      list: { label: 'Published', searchable: false, sortable: true },
    };
    cfg.metadatas.legacyPublishedAt.list = {
      ...(cfg.metadatas.legacyPublishedAt.list || {}),
      label: 'Published',
      sortable: true,
    };

    if (Array.isArray(cfg.layouts?.list)) {
      const list = cfg.layouts.list.filter((f) => f !== 'legacyPublishedAt' && f !== 'id');
      cfg.layouts.list = ['legacyPublishedAt', ...list].slice(0, 6);
    }

    await conn.query('UPDATE strapi_core_store_settings SET value = ? WHERE id = ?', [
      JSON.stringify(cfg),
      rows[0].id,
    ]);
    console.log('updated', key, '→', sortBy, 'DESC');
  }

  await conn.end();
  console.log('Done. Hard-refresh Strapi admin.');
}

main().catch((e) => {
  console.error('FAIL', e.code || e.message);
  console.error(
    'If Access denied / timeout: hPanel → Remote MySQL → allow your IP, or sort manually in admin (Published column).'
  );
  process.exit(1);
});
