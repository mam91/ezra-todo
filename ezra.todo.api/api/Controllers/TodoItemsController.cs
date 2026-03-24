using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApi.DTOs.TodoItems;
using TodoApi.Services.Interfaces;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/lists/{listId:guid}/todos")]
[Authorize]
public class TodoItemsController(ITodoItemService _todoItemService, IUserService _currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid listId)
    {
        var items = await _todoItemService.GetAllAsync(listId, _currentUser.UserId);
        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid listId, Guid id)
    {
        var item = await _todoItemService.GetByIdAsync(listId, id, _currentUser.UserId);
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid listId, [FromBody] CreateTodoItemRequest request)
    {
        var item = await _todoItemService.CreateAsync(listId, request, _currentUser.UserId);
        return CreatedAtAction(nameof(GetById), new { listId, id = item.Id }, item);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid listId, Guid id, [FromBody] UpdateTodoItemRequest request)
    {
        var item = await _todoItemService.UpdateAsync(listId, id, request, _currentUser.UserId);
        return Ok(item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid listId, Guid id)
    {
        await _todoItemService.DeleteAsync(listId, id, _currentUser.UserId);
        return NoContent();
    }

    [HttpPatch("{id:guid}/complete")]
    public async Task<IActionResult> ToggleComplete(Guid listId, Guid id)
    {
        var item = await _todoItemService.ToggleCompleteAsync(listId, id, _currentUser.UserId);
        return Ok(item);
    }
}
