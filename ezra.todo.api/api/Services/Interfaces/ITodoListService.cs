using TodoApi.DTOs.TodoLists;

namespace TodoApi.Services.Interfaces;

public interface ITodoListService
{
    Task<IEnumerable<TodoListResponse>> GetAllForUserAsync(Guid userId);
    Task<TodoListResponse> GetByIdAsync(Guid listId, Guid userId);
    Task<TodoListResponse> CreateAsync(CreateTodoListRequest request, Guid userId);
    Task<TodoListResponse> UpdateAsync(Guid listId, UpdateTodoListRequest request, Guid userId);
    Task DeleteAsync(Guid listId, Guid userId);
}
