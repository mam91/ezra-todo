using Microsoft.EntityFrameworkCore;
using TodoApi.Data;
using TodoApi.DTOs.TodoLists;
using TodoApi.Exceptions;
using TodoApi.Models;
using TodoApi.Services.Interfaces;

namespace TodoApi.Services;

public class TodoListService(AppDbContext _context, ILogger<TodoListService> _logger) : ITodoListService
{
    public async Task<IEnumerable<TodoListResponse>> GetAllForUserAsync(Guid userId)
    {
        _logger.LogInformation("Fetching all todo lists for user {UserId}", userId);

        var lists = await _context.TodoLists
            .Where(tl => tl.UserId == userId)
            .ToListAsync();

        return lists.Select(MapToResponse);
    }

    public async Task<TodoListResponse> GetByIdAsync(Guid listId, Guid userId)
    {
        _logger.LogInformation("Fetching todo list {ListId} for user {UserId}", listId, userId);

        var list = await GetOwnedListAsync(listId, userId);
        return MapToResponse(list);
    }

    public async Task<TodoListResponse> CreateAsync(CreateTodoListRequest request, Guid userId)
    {
        _logger.LogInformation("Creating todo list for user {UserId}", userId);

        var now = DateTime.UtcNow;
        var todoList = new TodoList
        {
            UserId = userId,
            Title = request.Title,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.TodoLists.Add(todoList);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Todo list {ListId} created for user {UserId}", todoList.Id, userId);

        return MapToResponse(todoList);
    }

    public async Task<TodoListResponse> UpdateAsync(Guid listId, UpdateTodoListRequest request, Guid userId)
    {
        _logger.LogInformation("Updating todo list {ListId} for user {UserId}", listId, userId);

        var todoList = await GetOwnedListAsync(listId, userId);
        todoList.Title = request.Title;
        todoList.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Todo list {ListId} updated by user {UserId}", listId, userId);

        return MapToResponse(todoList);
    }

    public async Task DeleteAsync(Guid listId, Guid userId)
    {
        _logger.LogInformation("Deleting todo list {ListId} for user {UserId}", listId, userId);

        var todoList = await GetOwnedListAsync(listId, userId);
        _context.TodoLists.Remove(todoList);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Todo list {ListId} deleted by user {UserId}", listId, userId);
    }

    private async Task<TodoList> GetOwnedListAsync(Guid listId, Guid userId)
    {
        var list = await _context.TodoLists.FirstOrDefaultAsync(tl => tl.Id == listId);
        if (list == null || list.UserId != userId)
        {
            _logger.LogWarning("User {UserId} does not own list {ListId}", userId, listId);
            throw new NotFoundException($"Todo list {listId} not found.");
        }
        return list;
    }

    private static TodoListResponse MapToResponse(TodoList list)
    {
        return new TodoListResponse
        {
            Id = list.Id,
            Title = list.Title,
            CreatedAt = list.CreatedAt,
            UpdatedAt = list.UpdatedAt
        };
    }
}
