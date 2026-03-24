namespace TodoApi.Services.Interfaces;

public interface IEmailService
{
    Task SendEmailConfirmationAsync(string toEmail, string confirmationToken);
}
