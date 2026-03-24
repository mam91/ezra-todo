using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TodoApi.DTOs.Auth;
using TodoApi.Exceptions;
using TodoApi.Models;
using TodoApi.Services;
using Xunit;

namespace TodoApi.Tests.Services;

public class AuthServiceTests : IDisposable
{
    private readonly TestDbHelper _db = new();
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "ThisIsATestSecretKeyThatIs32Chars!",
                ["Jwt:Issuer"] = "TestIssuer",
                ["Jwt:Audience"] = "TestAudience",
                ["Jwt:ExpiryHours"] = "1",
            })
            .Build();

        var emailService = new EmailService(config, NullLogger<EmailService>.Instance);

        _sut = new AuthService(
            _db.Context,
            emailService,
            config,
            NullLogger<AuthService>.Instance);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task Register_CreatesUserAndReturnsToken()
    {
        var result = await _sut.RegisterAsync(new RegisterRequest
        {
            Email = "new@example.com",
            Password = "password123"
        });

        Assert.Equal("new@example.com", result.Email);
        Assert.NotEmpty(result.Token);
        Assert.NotEqual(Guid.Empty, result.UserId);

        var user = await _db.Context.Users.FindAsync(result.UserId);
        Assert.NotNull(user);
        Assert.Equal("new@example.com", user.Email);
    }

    [Fact]
    public async Task Register_NormalizesEmailToLowercase()
    {
        var result = await _sut.RegisterAsync(new RegisterRequest
        {
            Email = "USER@Example.COM",
            Password = "password123"
        });

        Assert.Equal("user@example.com", result.Email);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ThrowsBadRequest()
    {
        await _sut.RegisterAsync(new RegisterRequest
        {
            Email = "dupe@example.com",
            Password = "password123"
        });

        await Assert.ThrowsAsync<BadRequestException>(() =>
            _sut.RegisterAsync(new RegisterRequest
            {
                Email = "dupe@example.com",
                Password = "password456"
            }));
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        await _sut.RegisterAsync(new RegisterRequest
        {
            Email = "login@example.com",
            Password = "password123"
        });

        // Manually confirm the email so login succeeds
        var user = _db.Context.Users.First(u => u.Email == "login@example.com");
        user.EmailConfirmedAt = DateTime.UtcNow;
        await _db.Context.SaveChangesAsync();

        var result = await _sut.LoginAsync(new LoginRequest
        {
            Email = "login@example.com",
            Password = "password123"
        });

        Assert.Equal("login@example.com", result.Email);
        Assert.NotEmpty(result.Token);
    }

    [Fact]
    public async Task Login_WrongPassword_ThrowsUnauthorized()
    {
        await _sut.RegisterAsync(new RegisterRequest
        {
            Email = "wrong@example.com",
            Password = "password123"
        });

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            _sut.LoginAsync(new LoginRequest
            {
                Email = "wrong@example.com",
                Password = "wrongpassword"
            }));
    }

    [Fact]
    public async Task Login_UnconfirmedEmail_ThrowsEmailNotConfirmed()
    {
        await _sut.RegisterAsync(new RegisterRequest
        {
            Email = "unconfirmed@example.com",
            Password = "password123"
        });

        await Assert.ThrowsAsync<EmailNotConfirmedException>(() =>
            _sut.LoginAsync(new LoginRequest
            {
                Email = "unconfirmed@example.com",
                Password = "password123"
            }));
    }

    [Fact]
    public async Task ConfirmEmail_ValidToken_ConfirmsUser()
    {
        await _sut.RegisterAsync(new RegisterRequest
        {
            Email = "confirm@example.com",
            Password = "password123"
        });

        var user = _db.Context.Users.First(u => u.Email == "confirm@example.com");
        Assert.Null(user.EmailConfirmedAt);

        var authToken = _db.Context.AuthTokens.First(t => t.Id == user.EmailConfirmationTokenId);

        await _sut.ConfirmEmailAsync(authToken.Token);

        // Reload from DB
        await _db.Context.Entry(user).ReloadAsync();
        Assert.NotNull(user.EmailConfirmedAt);
    }

    [Fact]
    public async Task ConfirmEmail_InvalidToken_ThrowsBadRequest()
    {
        await Assert.ThrowsAsync<BadRequestException>(() =>
            _sut.ConfirmEmailAsync("nonexistent-token"));
    }
}
