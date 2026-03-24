namespace TodoApi.Models;

public class TodoList
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<TodoItem> TodoItems { get; set; } = new List<TodoItem>();
}
