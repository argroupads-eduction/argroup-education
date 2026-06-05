import * as migration_20260603_124934_menu_header from './20260603_124934_menu_header';

export const migrations = [
  {
    up: migration_20260603_124934_menu_header.up,
    down: migration_20260603_124934_menu_header.down,
    name: '20260603_124934_menu_header'
  },
];
