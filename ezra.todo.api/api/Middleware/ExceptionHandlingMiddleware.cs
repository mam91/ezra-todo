using System.Text.Json;
using TodoApi.Exceptions;

namespace TodoApi.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate _next, ILogger<ExceptionHandlingMiddleware> _logger)
{
    private static readonly JsonSerializerOptions _jsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        int statusCode;
        string message;

        switch (exception)
        {
            case AppException ex:
                statusCode = ex.StatusCode;
                message = ex.Message;
                _logger.LogWarning("{ExceptionType}: {Message}", ex.GetType().Name, ex.Message);
                break;

            default:
                statusCode = StatusCodes.Status500InternalServerError;
                message = "An unexpected error occurred.";
                _logger.LogError(exception, "Unhandled exception");
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var response = new { error = message, statusCode };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, _jsonOptions));
    }
}
