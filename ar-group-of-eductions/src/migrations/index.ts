import * as migration_20260603_124934_menu_header from './20260603_124934_menu_header';
import * as migration_20260610_cms_html_seo from './20260610_cms_html_seo';

export const migrations = [
  {
    up: migration_20260603_124934_menu_header.up,
    down: migration_20260603_124934_menu_header.down,
    name: '20260603_124934_menu_header',
  },
  {
    up: migration_20260610_cms_html_seo.up,
    down: migration_20260610_cms_html_seo.down,
    name: '20260610_cms_html_seo',
  },
];
