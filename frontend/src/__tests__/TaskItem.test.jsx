import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskItem } from '../components/TaskItem';

// Mock the useAuth hook
jest.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('mock-token'),
  }),
}));

// Mock the fetch function
global.fetch = jest.fn();

describe('TaskItem Component', () => {
  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    completed: false,
    priority: 'MEDIUM',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    tags: []
  };

  const mockOnUpdate = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  test('renders task item correctly', () => {
    render(
      <TaskItem
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Priority: MEDIUM')).toBeInTheDocument();
  });

  test('toggles completion status', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockTask, completed: true }),
    });

    render(
      <TaskItem
        task={{ ...mockTask, completed: false }}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/tasks/1/toggle-completion',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });

  test('enters edit mode when edit button is clicked', () => {
    render(
      <TaskItem
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
  });

  test('updates task when form is submitted in edit mode', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockTask, title: 'Updated Task' }),
    });

    render(
      <TaskItem
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Enter edit mode
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Update the title
    const titleInput = screen.getByDisplayValue('Test Task');
    fireEvent.change(titleInput, { target: { value: 'Updated Task' } });

    // Submit the form
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/tasks/1',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Updated Task',
            description: 'Test Description',
            priority: 'MEDIUM',
          }),
        })
      );
    });
  });

  test('deletes task when delete button is clicked', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
    });

    render(
      <TaskItem
        task={mockTask}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    // Mock window.confirm to return true
    window.confirm = jest.fn(() => true);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this task?');
      expect(fetch).toHaveBeenCalledWith(
        '/api/v1/tasks/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-token',
          },
        })
      );
    });
  });

  test('shows error message when API call fails', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: 'Failed to update task' }),
    });

    render(
      <TaskItem
        task={{ ...mockTask, completed: false }}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText('Error: Failed to update task')).toBeInTheDocument();
    });
  });
});