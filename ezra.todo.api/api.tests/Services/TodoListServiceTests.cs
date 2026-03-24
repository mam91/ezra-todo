using Microsoft.Extensions.Logging.Abstractions;
using TodoApi.DTOs.TodoLists;
using TodoApi.Exceptions;
using TodoApi.Models;
using TodoApi.Services;
using Xunit;

namespace TodoApi.Tests.Services;

public class TodoListServiceTests : IDisposable
{
    private readonly TestDbHelper _db = new();
    private readonly TodoListService _sut;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _otherUserId = Guid.NewGuid();

    public TodoListServiceTests()
    {
        _sut = new TodoListService(_db.Context, NullLogger<TodoListService>.Instance);

        _db.Context.Users.AddRange(
            new User { Id = _userId, Email = "owner@test.com", PasswordHash = "x", CreatedAt = DateTime.UtcNow },
            new User { Id = _otherUserId, Email = "other@test.com", PasswordHash = "x", CreatedAt = DateTime.UtcNow }
        );
        _db.Context.SaveChanges();
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task Create_ReturnsList_WithCorrectFields()
    {
        var result = await _sut.CreateAsync(
            new CreateTodoListRequest { Title = "Groceries" },
            _userId);

        Assert.Equal("Groceries", result.Title);
        Assert.NotEqual(Guid.Empty, result.Id);
    }

    [Fact]
    public async Task GetAll_ReturnsOnlyOwnedLists()
    {
        await _sut.CreateAsync(new CreateTodoListRequest { Title = "Mine" }, _userId);
        await _sut.CreateAsync(new CreateTodoListRequest { Title = "Also Mine" }, _userId);
        await _sut.CreateAsync(new CreateTodoListRequest { Title = "Not Mine" }, _otherUserId);

        var results = (await _sut.GetAllForUserAsync(_userId)).ToList();

        Assert.Equal(2, results.Count);
        Assert.All(results, r => Assert.Contains("Mine", r.Title));
    }

    [Fact]
    public async Task GetById_OwnedList_ReturnsList()
    {
        var created = await _sut.CreateAsync(
            new CreateTodoListRequest { Title = "My List" }, _userId);

        var result = await _sut.GetByIdAsync(created.Id, _userId);

        Assert.Equal("My List", result.Title);
    }

    [Fact]
    public async Task GetById_OtherUsersListId_ThrowsNotFound()
    {
        var created = await _sut.CreateAsync(
            new CreateTodoListRequest { Title = "Private" }, _otherUserId);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _sut.GetByIdAsync(created.Id, _userId));
    }

    [Fact]
    public async Task Update_ChangesFields()
    {
        var created = await _sut.CreateAsync(
            new CreateTodoListRequest { Title = "Old" }, _userId);

        var updated = await _sut.UpdateAsync(
            created.Id,
            new UpdateTodoListRequest { Title = "New" },
            _userId);

        Assert.Equal("New", updated.Title);
    }

    [Fact]
    public async Task Delete_RemovesFromDatabase()
    {
        var created = await _sut.CreateAsync(
            new CreateTodoListRequest { Title = "Doomed" }, _userId);

        await _sut.DeleteAsync(created.Id, _userId);

        var lists = (await _sut.GetAllForUserAsync(_userId)).ToList();
        Assert.Empty(lists);
    }

    [Fact]
    public async Task Delete_OtherUsersListId_ThrowsNotFound()
    {
        var created = await _sut.CreateAsync(
            new CreateTodoListRequest { Title = "Protected" }, _otherUserId);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            _sut.DeleteAsync(created.Id, _userId));
    }
}
