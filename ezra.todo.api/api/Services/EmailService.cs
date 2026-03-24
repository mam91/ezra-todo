using TodoApi.Services.Interfaces;

namespace TodoApi.Services;

public class EmailService(IConfiguration _configuration, ILogger<EmailService> _logger) : IEmailService
{
    public Task SendEmailConfirmationAsync(string toEmail, string confirmationToken)
    {
        var frontendUrl = _configuration["FrontendUrl"]?.TrimEnd('/') ?? "http://localhost:5173";
        var confirmUrl = $"{frontendUrl}/confirm-email?token={Uri.EscapeDataString(confirmationToken)}";

        _logger.LogInformation(
            "[EMAIL STUB] Sending email confirmation to {Email}. Confirmation URL: {Url}",
            toEmail,
            confirmUrl);
        return Task.CompletedTask;
    }
}
