using Microsoft.AspNetCore.Mvc;
using TodoApi.DTOs.Auth;
using TodoApi.Services.Interfaces;

namespace TodoApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService _authService, IConfiguration _configuration) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var response = await _authService.RegisterAsync(request);
        SetTokenCookie(response.Token);
        return Ok(new { response.Email, response.UserId, response.ExpiresAt });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        SetTokenCookie(response.Token);
        return Ok(new { response.Email, response.UserId, response.ExpiresAt });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("token", new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.None,
            Secure = true,
            Path = "/"
        });
        return Ok(new { message = "Logged out." });
    }

    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string token)
    {
        if (string.IsNullOrEmpty(token))
            return BadRequest(new { error = "Token is required.", statusCode = 400 });

        await _authService.ConfirmEmailAsync(token);
        return Ok(new { message = "Email confirmed successfully." });
    }

    [HttpPost("resend-confirmation")]
    public async Task<IActionResult> ResendConfirmation([FromBody] ResendConfirmationRequest request)
    {
        await _authService.ResendConfirmationAsync(request.Email);
        return Ok(new { message = "If an account with that email exists and is unconfirmed, a new confirmation email has been sent." });
    }

    private void SetTokenCookie(string token)
    {
        var expiryHours = int.Parse(_configuration["Jwt:ExpiryHours"] ?? "24");
        Response.Cookies.Append("token", token, new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.None,
            Secure = true,
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddHours(expiryHours)
        });
    }
}
