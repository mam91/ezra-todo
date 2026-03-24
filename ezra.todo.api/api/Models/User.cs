namespace TodoApi.Models;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public Guid? EmailConfirmationTokenId { get; set; }
    public AuthToken? EmailConfirmationToken { get; set; }
    public DateTime? EmailConfirmedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<TodoList> TodoLists { get; set; } = new List<TodoList>();
}
