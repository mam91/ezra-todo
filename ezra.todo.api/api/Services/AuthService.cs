using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using TodoApi.Data;
using TodoApi.DTOs.Auth;
using TodoApi.Exceptions;
using TodoApi.Models;
using TodoApi.Services.Interfaces;

namespace TodoApi.Services;

public class AuthService(
    AppDbContext _context,
    IEmailService _emailService,
    IConfiguration _configuration,
    ILogger<AuthService> _logger) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        _logger.LogInformation("Registering new user with email {Email}", request.Email);

        var normalizedEmail = request.Email.ToLowerInvariant();
        var existing = await _context.Users.AnyAsync(u => u.Email == normalizedEmail);
        if (existing)
        {
            _logger.LogWarning("Registration failed: email {Email} already exists", request.Email);
            throw new BadRequestException("A user with this email already exists.");
        }

        var confirmToken = await CreateAuthTokenAsync(AuthTokenType.EmailConfirmation);

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            EmailConfirmationTokenId = confirmToken.Id,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        _logger.LogInformation("User {UserId} created with email {Email}", user.Id, user.Email);

        await _emailService.SendEmailConfirmationAsync(user.Email, confirmToken.Token);

        var jwt = GenerateJwt(user);
        return BuildAuthResponse(user, jwt);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        _logger.LogInformation("Login attempt for email {Email}", request.Email);

        var normalizedEmail = request.Email.ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Login failed: invalid credentials for email {Email}", request.Email);
            throw new UnauthorizedException("Invalid email or password.");
        }

        if (user.EmailConfirmedAt == null)
        {
            _logger.LogWarning("Login failed: email not confirmed for user {UserId}", user.Id);
            throw new EmailNotConfirmedException("Email address has not been confirmed.");
        }

        _logger.LogInformation("User {UserId} logged in successfully", user.Id);

        var jwt = GenerateJwt(user);
        return BuildAuthResponse(user, jwt);
    }

    public async Task ConfirmEmailAsync(string token)
    {
        _logger.LogInformation("Attempting email confirmation with token");

        var authToken = await _context.AuthTokens.FirstOrDefaultAsync(t => t.Token == token);
        if (authToken == null || authToken.Type != AuthTokenType.EmailConfirmation)
        {
            _logger.LogWarning("Email confirmation failed: invalid token");
            throw new BadRequestException("Invalid or expired confirmation token.");
        }

        if (authToken.ExpiresAt < DateTime.UtcNow)
        {
            _logger.LogWarning("Email confirmation failed: token expired");
            throw new BadRequestException("Confirmation token has expired.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.EmailConfirmationTokenId == authToken.Id);
        if (user == null)
        {
            _logger.LogWarning("Email confirmation failed: no user found for token id {TokenId}", authToken.Id);
            throw new BadRequestException("Invalid confirmation token.");
        }

        if (authToken.UsedAt != null && user.EmailConfirmedAt != null)
        {
            _logger.LogInformation("Email already confirmed for user {UserId}, returning success", user.Id);
            return;
        }

        authToken.UsedAt = DateTime.UtcNow;
        user.EmailConfirmedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Email confirmed for user {UserId}", user.Id);
    }

    public async Task ResendConfirmationAsync(string email)
    {
        _logger.LogInformation("Resending confirmation email to {Email}", email);

        var normalizedEmail = email.ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail);
        if (user == null)
        {
            _logger.LogWarning("Resend confirmation: no user found for email {Email}", email);
            return;
        }

        if (user.EmailConfirmedAt != null)
        {
            _logger.LogInformation("Resend confirmation: user {UserId} email already confirmed", user.Id);
            return;
        }

        var confirmToken = await CreateAuthTokenAsync(AuthTokenType.EmailConfirmation);
        user.EmailConfirmationTokenId = confirmToken.Id;
        await _context.SaveChangesAsync();

        await _emailService.SendEmailConfirmationAsync(user.Email, confirmToken.Token);
        _logger.LogInformation("Confirmation email resent for user {UserId}", user.Id);
    }

    private string GenerateJwt(User user)
    {
        var secret = _configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("JWT secret not configured.");
        var issuer = _configuration["Jwt:Issuer"] ?? "TodoApi";
        var audience = _configuration["Jwt:Audience"] ?? "TodoApp";
        var expiryHours = int.Parse(_configuration["Jwt:ExpiryHours"] ?? "24");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private AuthResponse BuildAuthResponse(User user, string jwt)
    {
        var expiryHours = int.Parse(_configuration["Jwt:ExpiryHours"] ?? "24");
        return new AuthResponse
        {
            Token = jwt,
            Email = user.Email,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddHours(expiryHours)
        };
    }

    private async Task<AuthToken> CreateAuthTokenAsync(AuthTokenType type)
    {
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        var tokenString = Convert.ToBase64String(tokenBytes)
            .Replace("+", "-").Replace("/", "_").Replace("=", "");

        var authToken = new AuthToken
        {
            Token = tokenString,
            Type = type,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow
        };

        _context.AuthTokens.Add(authToken);
        await _context.SaveChangesAsync();
        return authToken;
    }
}
