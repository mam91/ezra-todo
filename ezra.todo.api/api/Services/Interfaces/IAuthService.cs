using TodoApi.DTOs.Auth;

namespace TodoApi.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task ConfirmEmailAsync(string token);
    Task ResendConfirmationAsync(string email);
}
