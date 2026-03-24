import type { Tag } from './tag';

export type TagsChangedDetail =
  | { type: 'created'; tag: Tag }
  | { type: 'updated'; tag: Tag }
  | { type: 'deleted'; tagId: number };
