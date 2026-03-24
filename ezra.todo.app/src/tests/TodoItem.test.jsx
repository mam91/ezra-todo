import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TodoItem from '../components/TodoItem.jsx'
import client from '../api/client.js'

vi.mock('../api/client.js', () => ({
  default: {
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}))

const LIST_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012'
const TODO_ID = 'd4e5f6a7-b8c9-0123-def0-234567890123'

const baseTodo = {
  id: TODO_ID,
  todoListId: LIST_ID,
  title: 'Buy groceries',
  description: 'Milk, eggs, bread',
  isCompleted: false,
  dueDate: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

function renderTodoItem(overrides = {}, callbacks = {}) {
  const todo = { ...baseTodo, ...overrides }
  const onUpdate = callbacks.onUpdate ?? vi.fn()
  const onDelete = callbacks.onDelete ?? vi.fn()

  render(
    <TodoItem
      todo={todo}
      listId={LIST_ID}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  )

  return { todo, onUpdate, onDelete }
}

describe('TodoItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the todo title', () => {
    renderTodoItem()
    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
  })

  it('renders the todo description', () => {
    renderTodoItem()
    expect(screen.getByText('Milk, eggs, bread')).toBeInTheDocument()
  })

  it('renders completed todo with strikethrough style', () => {
    renderTodoItem({ isCompleted: true })
    const title = screen.getByText('Buy groceries')
    expect(title.className).toMatch(/line-through/)
  })

  it('renders due date when provided', () => {
    renderTodoItem({ dueDate: '2026-12-31T00:00:00Z' })
    expect(screen.getByText(/Due:/)).toBeInTheDocument()
  })

  it('shows overdue indicator when due date is in the past and not completed', () => {
    renderTodoItem({ dueDate: '2020-01-01T00:00:00Z', isCompleted: false })
    expect(screen.getByText(/Overdue/)).toBeInTheDocument()
  })

  it('clicking checkbox calls toggle API and optimistically updates', async () => {
    const toggledTodo = { ...baseTodo, isCompleted: true }
    client.patch.mockResolvedValueOnce({ data: toggledTodo })

    const onUpdate = vi.fn()
    renderTodoItem({}, { onUpdate })

    const checkbox = screen.getByRole('button', { name: /mark complete/i })
    await userEvent.click(checkbox)

    // Optimistic update should fire immediately with flipped state
    expect(onUpdate).toHaveBeenNthCalledWith(1, expect.objectContaining({ isCompleted: true }))

    await waitFor(() => {
      // Confirmed update from API response
      expect(onUpdate).toHaveBeenCalledWith(toggledTodo)
    })

    expect(client.patch).toHaveBeenCalledWith(`/api/lists/${LIST_ID}/todos/${TODO_ID}/complete`)
  })

  it('reverts optimistic update when toggle API fails', async () => {
    client.patch.mockRejectedValueOnce(new Error('Network error'))

    const onUpdate = vi.fn()
    renderTodoItem({}, { onUpdate })

    const checkbox = screen.getByRole('button', { name: /mark complete/i })
    await userEvent.click(checkbox)

    await waitFor(() => {
      // Called twice: once for optimistic update, once for revert
      expect(onUpdate).toHaveBeenCalledTimes(2)
      // Second call should revert to original
      expect(onUpdate).toHaveBeenLastCalledWith(baseTodo)
    })
  })

  it('delete button shows confirmation prompt before deleting', async () => {
    renderTodoItem()

    const deleteBtn = screen.getByRole('button', { name: /delete todo/i })
    await userEvent.click(deleteBtn)

    // Confirmation buttons should appear
    expect(screen.getByText('Delete')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('confirming delete calls onDelete and delete API', async () => {
    client.delete.mockResolvedValueOnce({})

    const onDelete = vi.fn()
    renderTodoItem({}, { onDelete })

    // Click delete icon
    await userEvent.click(screen.getByRole('button', { name: /delete todo/i }))
    // Click confirmation
    await userEvent.click(screen.getByText('Delete'))

    expect(onDelete).toHaveBeenCalledWith(TODO_ID)
    await waitFor(() => {
      expect(client.delete).toHaveBeenCalledWith(`/api/lists/${LIST_ID}/todos/${TODO_ID}`)
    })
  })

  it('cancelling delete hides confirmation and does not call API', async () => {
    renderTodoItem()

    await userEvent.click(screen.getByRole('button', { name: /delete todo/i }))
    expect(screen.getByText('Cancel')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Cancel'))

    expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
    expect(client.delete).not.toHaveBeenCalled()
  })

  it('clicking edit button opens inline edit mode', async () => {
    renderTodoItem()

    const editBtn = screen.getByRole('button', { name: /edit todo/i })
    await userEvent.click(editBtn)

    expect(screen.getByDisplayValue('Buy groceries')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save todo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })
})
