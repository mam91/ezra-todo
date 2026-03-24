# Ezra Todo App

A full-stack to-do task management application built with ASP.NET Core 10 and React.  Very narrow in scope but the intention is for it to be close to functoinal as an MVP.  Applications are decoupled to ensure independent deployment and scaling.

## Future Technical Considerations

- Real email provider integration (SendGrid, AWS SES).
  - Email confirmation is required before login. The email service is currently stubbed to console output — confirmation links are logged rather than sent. 
- Deployment plan
  - For this MVP, I would deploy both applications to GCP Cloud run for simplicity and speed. Basic steps of creating a cloud build yaml file, configuring Github connection in Cloud Build console and clicking build.  Easy peasy.
- Structured Logging leveraging a library like Serilog.
- Observability improvements / monitoring / alerting.
- Rate limiting on authentication endpoints.
  - Can't make it easy for the hackers
- Possible vertical slice architecture as the app grows.  Organizing API by feature can be incredibly useful when working on a large project with others.
- Possible fluent validation for more complex validation scenarios.
- Event architecture for async style processing (notifications/emails).
- Linter to catch things like unused variables
- Additional test coverage: controller/integration tests to verify the HTTP pipeline, and integration tests against a production-equivalent database engine when we move off SQLite.

## Future Product Considerations
- Sharing feature.
  - This will require planning for concurrency/contention since N users could be editing/viewing the same list.  Solved via optimistic concurrency (column on tables with contention).
  - Likely requires real-time updates.  Leverage something like SignalR / websockets.
- Add ability to reorder lists and todos
  - New column on tables to store order 
- Validate mobile functionality and styling
- Eventual state will likely compete with products like trello/jira that have concepts of boards, lists, statuses, etc.

## Tech Stack

- **Backend:** ASP.NET Core 10, Entity Framework Core, SQLite, JWT (HttpOnly cookie)
- **Frontend:** React 18, React Router, Tailwind CSS, Vite
- **Testing:** xUnit (backend), Vitest + React Testing Library (frontend)

## Project Structure

```
ezra.todo.api/
  api/            — ASP.NET Core Web API
  api.tests/      — xUnit service-level tests (in-memory SQLite)
ezra.todo.app/    — React + Vite frontend
```

## Prerequisites

- [Docker](https://www.docker.com/) (for Docker Compose)
- [.NET 10 SDK](https://dotnet.microsoft.com/download) (for local development)
- [Node.js](https://nodejs.org) v20+ (for local development)

## Getting Started

### Option A: Docker Compose (recommended)

Run both services with a single command:

```bash
docker compose up --build
```

The app will be available at `http://localhost:3000`. The API runs on port `8080` behind the nginx reverse proxy. SQLite data is persisted in the `.data/` directory.

### Option B: Run Locally

#### 1. Start the API

```bash
cd ezra.todo.api/api
dotnet restore
dotnet run
```

The database is created and migrations are applied automatically on startup.

The API will be available at `http://localhost:8080`.

#### 2. Start the Frontend

```bash
cd ezra.todo.app
npm install
npm run dev
```

The app will be available at `http://localhost:3000`. The dev server proxies `/api` requests to `http://localhost:8080`.

### Creating an Account

1. Navigate to the register page and create an account.
2. Check the API logs (terminal output or `docker compose logs api`) for a line containing the email confirmation link.
3. Open that link in your browser to confirm your account.
4. You can now sign in.

Email sending is stubbed for this MVP -- confirmation links are logged to the console rather than sent via email.

## Tests

### Backend (xUnit + In-Memory SQLite)

The API uses [xUnit](https://xunit.net/) for testing. Tests run against an in-memory SQLite database (via `TestDbHelper`) which provides real SQL execution, constraint enforcement, and schema validation without requiring an external database server.

**What's tested:**
- **AuthService** -- Registration (success, email normalization, duplicate detection), login (valid credentials, wrong password, unconfirmed email), email confirmation (valid token, invalid token).
- **TodoListService** -- CRUD operations, ownership isolation between users, cross-user access returns not found.
- **TodoItemService** -- CRUD operations, toggle completion, ownership enforcement via parent list, non-existent item handling.

```bash
cd ezra.todo.api/api.tests
dotnet test
```

### Frontend (Vitest + React Testing Library)

The frontend uses [Vitest](https://vitest.dev/) as the test runner with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing. The API client is mocked so tests run without a backend.

**What's tested:**
- **AuthContext** -- Initial state, login persists user and calls API, logout clears state, restoring user from localStorage, failed login handling.
- **TodoItem** -- Rendering title/description/due date, completed styling, optimistic toggle with revert on failure, delete flow with confirmation, inline edit mode.

```bash
cd ezra.todo.app
npm test
```

## Build for Production

### Frontend

```bash
cd ezra.todo.app
npm run build
```

Output is in the `dist/` folder, ready to be served by nginx or any static file server.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ConnectionStrings__DefaultConnection` | SQLite connection string | `Data Source=todos.db` |
| `Jwt__Secret` | JWT signing key (min 32 chars) | see appsettings.json |
| `Jwt__ExpiryHours` | Token expiry in hours | `24` |
| `Cors__AllowedOrigin` | Allowed frontend origin | `http://localhost:3000` |
| `FrontendUrl` | Frontend URL for email links | `http://localhost:3000` |


