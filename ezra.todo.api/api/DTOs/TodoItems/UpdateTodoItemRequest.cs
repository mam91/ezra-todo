using System.ComponentModel.DataAnnotations;

namespace TodoApi.DTOs.TodoItems;

public class UpdateTodoItemRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsCompleted { get; set; }

    public DateTime? DueDate { get; set; }
}
