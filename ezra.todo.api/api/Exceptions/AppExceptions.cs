namespace TodoApi.Exceptions;

public abstract class AppException(string message, int statusCode) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

public class BadRequestException(string message) : AppException(message, 400) { }

public class UnauthorizedException(string message) : AppException(message, 401) { }

public class EmailNotConfirmedException(string message) : AppException(message, 403) { }

public class NotFoundException(string message) : AppException(message, 404) { }
