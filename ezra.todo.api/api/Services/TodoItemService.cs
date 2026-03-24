using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.DTOs.TodoItems;
using TodoApi.Exceptions;
using TodoApi.Models;
using TodoApi.Services.Interfaces;

namespace TodoApi.Services;

public class TodoItemService(AppDbContext _context, ILogger<TodoItemService> _logger) : ITodoItemService
{
    public async Task<IEnumerable<TodoItemResponse>> GetAllAsync(Guid listId, Guid userId)
    {
        _logger.LogInformation("Fetching all todo items in list {ListId} for user {UserId}", listId, userId);

        await EnsureOwnerAsync(userId, listId);
        var items = await _context.TodoItems
            .Where(ti => ti.TodoListId == listId)
            .OrderBy(ti => ti.CreatedAt)
            .ToListAsync();

        return items.Select(MapToResponse);
    }

    public async Task<TodoItemResponse> GetByIdAsync(Guid listId, Guid id, Guid userId)
    {
        _logger.LogInformation("Fetching todo item {ItemId} in list {ListId} for user {UserId}", id, listId, userId);

        await EnsureOwnerAsync(userId, listId);
        var item = await GetItemInListAsync(id, listId);
        return MapToResponse(item);
    }

    public async Task<TodoItemResponse> CreateAsync(Guid listId, CreateTodoItemRequest request, Guid userId)
    {
        _logger.LogInformation("Creating todo item in list {ListId} for user {UserId}", listId, userId);

        await EnsureOwnerAsync(userId, listId);

        var now = DateTime.UtcNow;
        var item = new TodoItem
        {
            TodoListId = listId,
            Title = request.Title,
            Description = request.Description,
            DueDate = request.DueDate,
            IsCompleted = false,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.TodoItems.Add(item);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Todo item {ItemId} created in list {ListId} by user {UserId}", item.Id, listId, userId);

        return MapToResponse(item);
    }

    public async Task<TodoItemResponse> UpdateAsync(Guid listId, Guid id, UpdateTodoItemRequest request, Guid userId)
    {
        _logger.LogInformation("Updating todo item {ItemId} in list {ListId} for user {UserId}", id, listId, userId);

        await EnsureOwnerAsync(userId, listId);

        var item = await GetItemInListAsync(id, listId);
        item.Title = request.Title;
        item.Description = request.Description;
        item.IsCompleted = request.IsCompleted;
        item.DueDate = request.DueDate;
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Todo item {ItemId} updated in list {ListId} by user {UserId}", id, listId, userId);

        return MapToResponse(item);
    }

    public async Task DeleteAsync(Guid listId, Guid id, Guid userId)
    {
        _logger.LogInformation("Deleting todo item {ItemId} in list {ListId} for user {UserId}", id, listId, userId);

        await EnsureOwnerAsync(userId, listId);

        var item = await GetItemInListAsync(id, listId);
        _context.TodoItems.Remove(item);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Todo item {ItemId} deleted from list {ListId} by user {UserId}", id, listId, userId);
    }

    public async Task<TodoItemResponse> ToggleCompleteAsync(Guid listId, Guid id, Guid userId)
    {
        _logger.LogInformation("Toggling completion for todo item {ItemId} in list {ListId} for user {UserId}", id, listId, userId);

        await EnsureOwnerAsync(userId, listId);

        var item = await GetItemInListAsync(id, listId);
        item.IsCompleted = !item.IsCompleted;
        item.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Todo item {ItemId} marked as {Status} in list {ListId} by user {UserId}",
            id, item.IsCompleted ? "completed" : "incomplete", listId, userId);

        return MapToResponse(item);
    }

    private async Task EnsureOwnerAsync(Guid userId, Guid listId)
    {
        var owns = await _context.TodoLists.AnyAsync(tl => tl.Id == listId && tl.UserId == userId);
        if (!owns)
        {
            _logger.LogWarning("User {UserId} does not own list {ListId}", userId, listId);
            throw new NotFoundException($"Todo list {listId} not found.");
        }
    }

    private async Task<TodoItem> GetItemInListAsync(Guid id, Guid listId)
    {
        var item = await _context.TodoItems.FirstOrDefaultAsync(ti => ti.Id == id);
        if (item == null || item.TodoListId != listId)
        {
            throw new NotFoundException($"Todo item {id} not found.");
        }
        return item;
    }

    private static TodoItemResponse MapToResponse(TodoItem item)
    {
        return new TodoItemResponse
        {
            Id = item.Id,
            TodoListId = item.TodoListId,
            Title = item.Title,
            Description = item.Description,
            IsCompleted = item.IsCompleted,
            DueDate = item.DueDate,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        };
    }
}
