export interface MenuItem {
  label: string;
  href: string;
  type: 'link' | 'dropdown';
  submenu?: SubmenuItem[];
}

export interface SubmenuItem {
  label: string;
  href: string;
}

export interface NavMenuCategory {
  id: string;
  title: string;
  type: 'link' | 'dropdown';
  url: string;
  items?: NavMenuItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface NavMenuItem {
  id: string;
  title: string;
  url: string;
  categoryId: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}
