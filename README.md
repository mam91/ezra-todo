# Ezra Todo App

A full-stack to-do task management application built with ASP.NET Core 10 and React.  Very narrow in scope but the intention is for it to be close to functoinal as an MVP.  Applications are decoupled to ensure independent deployment and scaling.

## Future Technical Considerations

- **Real email provider** — Integrate SendGrid or AWS SES. Email confirmation is required before login; currently the service is stubbed and confirmation links are logged to the console.
- **Production database** — Migrate from SQLite to PostgreSQL or SQL Server for concurrency, scalability, and Cloud Run compatibility (SQLite doesn't work well with ephemeral containers).
- **Structured logging** — Add Serilog (or similar) with structured log sinks for centralized log aggregation and searchability.
- **Observability** — Application-level metrics, distributed tracing (OpenTelemetry), health dashboards, and alerting.
- **Rate limiting** — Protect authentication and public endpoints from brute-force and abuse.
- **Expanded test coverage** — Controller/integration tests to verify the full HTTP pipeline (middleware, auth, routing), and integration tests against a production-equivalent database engine.
- **CI/CD hardening** — Add automated test steps to the build pipeline so deployments are gated on passing tests.
- **Vertical slice architecture** — As the domain grows, reorganize the API by feature rather than layer. This scales better when multiple developers are working in parallel.
- **FluentValidation** — Replace manual validation with FluentValidation for complex or reusable validation rules.
- **Event-driven processing** — Introduce a message bus (e.g., Cloud Pub/Sub) for async workflows like email delivery and notifications.
- **Frontend linting** — Add ESLint to catch unused variables, enforce consistent patterns, and integrate with CI.

## Future Product Considerations

- **List sharing & collaboration** — Allow users to share lists with view or edit access. This introduces concurrency concerns (optimistic concurrency via row versioning) and would benefit from real-time updates via SignalR or WebSockets.
- **Drag-and-drop reordering** — Let users reorder both lists and todo items. Requires a sort-order column on each table.
- **Mobile responsiveness** — Validate and refine the UI for small screens; consider a PWA wrapper for an app-like mobile experience.
- **Rich task features** — Priority levels, labels/tags, recurring tasks, and subtasks.
- **Search and filtering** — Full-text search across lists and items, with filters for due date, completion status, and labels.
- **Board/Kanban view** — Offer an alternative view with columns representing statuses (To Do, In Progress, Done), moving toward a lightweight project management tool.

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


