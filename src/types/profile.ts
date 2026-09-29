import type { PROFILE_TABS } from '../constants/profile-tabs';

export type TabKey = (typeof PROFILE_TABS)[number]['key'];

export interface PicsumPhoto {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
}

export interface FeedPhoto extends PicsumPhoto {
  key: string;
  thumbnailUrl: string;
}

export type ProfileListItem =
  | {
      kind: 'profile';
      key: 'profile-header';
    }
  | {
      kind: 'tabs';
      key: 'profile-tabs';
    }
  | {
      kind: 'photo';
      key: string;
      photo: FeedPhoto;
    };
