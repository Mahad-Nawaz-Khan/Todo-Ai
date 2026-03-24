import type { Tag } from './tag';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type RecurrenceValue = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type RecurrenceInput = '' | RecurrenceValue;

export interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  due_date: string | null;
  recurrence_rule: RecurrenceValue | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface TaskUpsertPayload {
  title: string;
  description: string;
  priority: Priority;
  due_date: string | null;
  recurrence_rule: RecurrenceValue | null;
  tag_ids: number[];
}
