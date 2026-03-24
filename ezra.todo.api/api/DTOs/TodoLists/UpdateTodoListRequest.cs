using System.ComponentModel.DataAnnotations;

namespace TodoApi.DTOs.TodoLists;

public class UpdateTodoListRequest
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;
}
