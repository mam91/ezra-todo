using System.ComponentModel.DataAnnotations;

namespace TodoApi.DTOs.TodoLists;

public class CreateTodoListRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
}
