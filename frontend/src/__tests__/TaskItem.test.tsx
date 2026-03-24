import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { TaskItem } from '../components/TaskItem';
import type { Task } from '@/types/task';

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('mock-token'),
  }),
}));

const fetchMock = jest.fn();
global.fetch = fetchMock as typeof fetch;

describe('TaskItem Component', () => {
  const apiBaseUrl = 'http://localhost:8000';

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    completed: false,
    priority: 'MEDIUM',
    due_date: null,
    recurrence_rule: null,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    tags: [],
  };

  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
    process.env.NEXT_PUBLIC_API_URL = apiBaseUrl;
  });

  test('renders task item correctly', () => {
    render(<TaskItem task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  test('toggles completion status', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockTask, completed: true }),
    });

    render(
      <TaskItem task={{ ...mockTask, completed: false }} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />
    );

    fireEvent.click(screen.getByRole('checkbox'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${apiBaseUrl}/api/v1/tasks/1/toggle-completion`,
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });

  test('enters edit mode when edit button is clicked', () => {
    render(<TaskItem task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByText('Edit'));

    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
  });

  test('updates task when form is submitted in edit mode', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockTask, title: 'Updated Task' }),
    });

    render(<TaskItem task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByText('Edit'));
    fireEvent.change(screen.getByDisplayValue('Test Task'), { target: { value: 'Updated Task' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `${apiBaseUrl}/api/v1/tasks/1`,
        expect.objectContaining({
          method: 'PUT',
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Updated Task',
            description: 'Test Description',
            priority: 'MEDIUM',
            due_date: null,
            recurrence_rule: null,
            tag_ids: [],
          }),
        })
      );
    });
  });

  test('deletes task when delete button is clicked', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });
    window.confirm = jest.fn(() => true);

    render(<TaskItem task={mockTask} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />);

    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this task?');
      expect(fetchMock).toHaveBeenCalledWith(
        `${apiBaseUrl}/api/v1/tasks/1`,
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer mock-token',
          },
        })
      );
    });
  });

  test('shows error message when API call fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Failed to update task' }),
    });

    render(
      <TaskItem task={{ ...mockTask, completed: false }} onUpdate={mockOnUpdate} onDelete={mockOnDelete} />
    );

    fireEvent.click(screen.getByRole('checkbox'));

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to update task')).toBeInTheDocument();
    });
  });
});
