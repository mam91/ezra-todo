using System.Security.Claims;
using TodoApi.Exceptions;
using TodoApi.Services.Interfaces;

namespace TodoApi.Services;

public class CurrentUserService : IUserService
{
    public Guid UserId { get; }

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        var user = httpContextAccessor.HttpContext?.User;
        var claim = user?.FindFirst(ClaimTypes.NameIdentifier)
            ?? user?.FindFirst("sub");

        if (claim == null || !Guid.TryParse(claim.Value, out var id))
            throw new UnauthorizedException("User identity could not be determined.");

        UserId = id;
    }
}
