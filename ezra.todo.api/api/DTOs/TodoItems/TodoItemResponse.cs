namespace TodoApi.DTOs.TodoItems;

public class TodoItemResponse
{
    public Guid Id { get; set; }
    public Guid TodoListId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
