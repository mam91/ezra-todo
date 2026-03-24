namespace TodoApi.Models;

public class TodoItem
{
    public Guid Id { get; set; }
    public Guid TodoListId { get; set; }
    public TodoList TodoList { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
