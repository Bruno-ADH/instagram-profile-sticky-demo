export const TAB_HEIGHT = 48;
export const GRID_COLUMNS = 3;

export const PROFILE_TABS = [
  { key: 'posts', icon: '▦', label: 'Publications' },
  { key: 'reels', icon: '▶', label: 'Reels' },
  { key: 'tagged', icon: '♙', label: 'Identifié' },
] as const;

export const TAB_KEYS = PROFILE_TABS.map((tab) => tab.key);
