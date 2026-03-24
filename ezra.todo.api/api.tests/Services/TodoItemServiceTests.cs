using Microsoft.Extensions.Logging.Abstractions;
using TodoApi.DTOs.TodoItems;
using TodoApi.DTOs.TodoLists;
using TodoApi.Exceptions;
using TodoApi.Models;
using TodoApi.Services;
using Xunit;

namespace TodoApi.Tests.Services;

public class TodoItemServiceTests : IDisposable
{
    private readonly TestDbHelper _db = new();
    private readonly TodoItemService _sut;
    private readonly TodoListService _listService;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _otherUserId = Guid.NewGuid();

    public TodoItemServiceTests()
    {
        _sut = new TodoItemService(_db.Context, NullLogger<TodoItemService>.Instance);
        _listService = new TodoListService(_db.Context, NullLogger<TodoListService>.Instance);

        _db.Context.Users.AddRange(
            new User { Id = _userId, Email = "owner@test.com", PasswordHash = "x", CreatedAt = DateTime.UtcNow },
            new User { Id = _otherUserId, Email = "other@test.com", PasswordHash = "x", CreatedAt = DateTime.UtcNow }
        );
        _db.Context.SaveChanges();
    }

    public void Dispose() => _db.Dispose();

    private async Task<Guid> CreateListAsync(Guid userId = default)
    {
        if (userId == default) userId = _userId;
        var list = await _listService.CreateAsync(
            new CreateTodoListRequest { Title = "Test List" }, userId);
        return list.Id;
    }

    [Fact]
    public async Task Create_ReturnsItem_WithCorrectFields()
    {
        var listId = await CreateListAsync();
        var dueDate = DateTime.UtcNow.AddDays(7);

        var result = await _sut.CreateAsync(listId, new CreateTodoItemRequest
        {
            Title = "Buy milk",
            Description = "From the store",
            DueDate = dueDate
        }, _userId);

        Assert.Equal("Buy milk", result.Title);
        Assert.Equal("From the store", result.Description);
        Assert.False(result.IsCompleted);
        Assert.NotEqual(Guid.Empty, result.Id);
    }

    [Fact]
    public async Task Create_OtherUsersList_ThrowsNotFound()
    {
        var listId = await CreateListAsync(_otherUserId);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _sut.CreateAsync(listId, new CreateTodoItemRequest { Title = "Nope" }, _userId));
    }

    [Fact]
    public async Task GetAll_ReturnsItemsForList()
    {
        var listId = await CreateListAsync();

        await _sut.CreateAsync(listId, new CreateTodoItemRequest { Title = "Item 1" }, _userId);
        await _sut.CreateAsync(listId, new CreateTodoItemRequest { Title = "Item 2" }, _userId);

        var results = (await _sut.GetAllAsync(listId, _userId)).ToList();
        Assert.Equal(2, results.Count);
    }

    [Fact]
    public async Task Update_ChangesFields()
    {
        var listId = await CreateListAsync();
        var item = await _sut.CreateAsync(listId,
            new CreateTodoItemRequest { Title = "Old Title" }, _userId);

        var updated = await _sut.UpdateAsync(listId, item.Id, new UpdateTodoItemRequest
        {
            Title = "New Title",
            Description = "Updated",
            IsCompleted = true
        }, _userId);

        Assert.Equal("New Title", updated.Title);
        Assert.Equal("Updated", updated.Description);
        Assert.True(updated.IsCompleted);
    }

    [Fact]
    public async Task ToggleComplete_FlipsStatus()
    {
        var listId = await CreateListAsync();
        var item = await _sut.CreateAsync(listId,
            new CreateTodoItemRequest { Title = "Toggle me" }, _userId);
        Assert.False(item.IsCompleted);

        var toggled = await _sut.ToggleCompleteAsync(listId, item.Id, _userId);
        Assert.True(toggled.IsCompleted);

        var toggledBack = await _sut.ToggleCompleteAsync(listId, item.Id, _userId);
        Assert.False(toggledBack.IsCompleted);
    }

    [Fact]
    public async Task Delete_RemovesItem()
    {
        var listId = await CreateListAsync();
        var item = await _sut.CreateAsync(listId,
            new CreateTodoItemRequest { Title = "Doomed" }, _userId);

        await _sut.DeleteAsync(listId, item.Id, _userId);

        var remaining = (await _sut.GetAllAsync(listId, _userId)).ToList();
        Assert.Empty(remaining);
    }

    [Fact]
    public async Task GetById_NonexistentItem_ThrowsNotFound()
    {
        var listId = await CreateListAsync();

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _sut.GetByIdAsync(listId, Guid.NewGuid(), _userId));
    }
}
