namespace TodoApi.Models;

public enum AuthTokenType
{
    EmailConfirmation
}

public class AuthToken
{
    public Guid Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public AuthTokenType Type { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
