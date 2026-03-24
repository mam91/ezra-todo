using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TodoApi.DTOs.TodoLists;
using TodoApi.Services.Interfaces;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/lists")]
[Authorize]
public class TodoListsController(ITodoListService _todoListService, IUserService _currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var lists = await _todoListService.GetAllForUserAsync(_currentUser.UserId);
        return Ok(lists);
    }

    [HttpGet("{listId:guid}")]
    public async Task<IActionResult> GetById(Guid listId)
    {
        var list = await _todoListService.GetByIdAsync(listId, _currentUser.UserId);
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTodoListRequest request)
    {
        var list = await _todoListService.CreateAsync(request, _currentUser.UserId);
        return CreatedAtAction(nameof(GetById), new { listId = list.Id }, list);
    }

    [HttpPut("{listId:guid}")]
    public async Task<IActionResult> Update(Guid listId, [FromBody] UpdateTodoListRequest request)
    {
        var list = await _todoListService.UpdateAsync(listId, request, _currentUser.UserId);
        return Ok(list);
    }

    [HttpDelete("{listId:guid}")]
    public async Task<IActionResult> Delete(Guid listId)
    {
        await _todoListService.DeleteAsync(listId, _currentUser.UserId);
        return NoContent();
    }
}
