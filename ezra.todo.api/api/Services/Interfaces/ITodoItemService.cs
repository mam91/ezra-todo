using TodoApi.DTOs.TodoItems;

namespace TodoApi.Services.Interfaces;

public interface ITodoItemService
{
    Task<IEnumerable<TodoItemResponse>> GetAllAsync(Guid listId, Guid userId);
    Task<TodoItemResponse> GetByIdAsync(Guid listId, Guid id, Guid userId);
    Task<TodoItemResponse> CreateAsync(Guid listId, CreateTodoItemRequest request, Guid userId);
    Task<TodoItemResponse> UpdateAsync(Guid listId, Guid id, UpdateTodoItemRequest request, Guid userId);
    Task DeleteAsync(Guid listId, Guid id, Guid userId);
    Task<TodoItemResponse> ToggleCompleteAsync(Guid listId, Guid id, Guid userId);
}
