import type { Tag } from './tag';

export type TagsChangedDetail =
  | { type: 'created'; tag: Tag }
  | { type: 'updated'; tag: Tag }
  | { type: 'deleted'; tagId: number };

/** Payload the AI assistant sends to re-filter/re-sort the task list. */
export type ApplyTaskViewDetail = {
  completed?: boolean | null;
  priority?: '' | 'HIGH' | 'MEDIUM' | 'LOW';
  sortBy?: 'created_at' | 'updated_at' | 'due_date' | 'priority';
  order?: 'asc' | 'desc';
};
