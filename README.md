# Todo List Application

A full-stack todo list application built with a React SPA frontend and an Express BFF (Backend for Frontend), following Domain-Driven Design (DDD) and 12-factor app principles.

---

## Architecture Overview

The application is split into two main components:

```
/
├── frontend/    # React SPA
└── bff/         # Express BFF — REST API layer
```

### BFF (Backend for Frontend)

The BFF is structured around DDD layering and 12-factor principles:

| Layer | Responsibility |
|---|---|
| **Interface** | Express routes and controllers — HTTP in/out only |
| **Application** | Use cases and orchestration logic |
| **Domain** | Entities, value objects, and domain rules |
| **Infrastructure** | SQLite persistence, repository implementations |

Configuration is injected via environment variables (12-factor III), keeping the application free of hard-coded environment-specific values.

The SPA communicates exclusively through the BFF's REST API — it has no direct knowledge of the persistence layer.

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later

---

## Build & Run

### 1. Clone the repository

```bash
git clone https://github.com/speakmancip/todolist.git
cd todolist
```

### 2. Configure environment variables

Copy the example env file in each package and edit as needed:

```bash
cp bff/.env.example bff/.env
cp frontend/.env.example frontend/.env
```

### 3. Install dependencies

```bash
# BFF
cd bff && npm install

# Frontend
cd ../frontend && npm install
```

### 4. Run in development

```bash
# Terminal 1 — BFF (defaults to http://localhost:3001)
cd bff && npm run dev

# Terminal 2 — React SPA (defaults to http://localhost:3000)
cd frontend && npm start
```

### 5. Run in production

```bash
# Build the React SPA
cd frontend && npm run build

# Start the BFF (serves the built SPA as static assets)
cd ../bff && npm start
```

---

## Running the Tests

Tests are written with [Jest](https://jestjs.io/).

```bash
# BFF unit and integration tests
cd bff && npm test

# Frontend component tests
cd frontend && npm test

# Run all tests from the root (if a root-level script is configured)
npm test
```

Test coverage report:

```bash
cd bff && npm run test:coverage
```

### Testing Strategy

- **Domain layer**: pure unit tests with no I/O — fast and dependency-free.
- **Application layer**: unit tests with repository interfaces mocked via Jest.
- **Interface layer**: integration tests using [supertest](https://github.com/ladjs/supertest) against a real Express app with an in-memory SQLite database.
- **Frontend**: component tests with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

This layered approach means the vast majority of business logic is covered by fast, isolated unit tests, with integration tests reserved for verifying the HTTP contract.

---

## Design Choices

### Domain-Driven Design

The BFF is structured around a clear domain boundary. `Todo` is the primary aggregate root, encapsulating its own invariants (e.g. a completed todo cannot be re-opened without explicit intent). Use cases in the application layer orchestrate domain logic and delegate persistence to repository interfaces — the domain has zero knowledge of SQLite.

### 12-Factor Compliance

| Factor | Applied |
|---|---|
| **III — Config** | All environment-specific values (port, DB path, CORS origin) via `.env` / environment variables |
| **IV — Backing services** | SQLite treated as an attached resource; path is configurable |
| **VI — Processes** | BFF is stateless — no in-process session state |
| **XI — Logs** | Structured logs written to stdout |

### SQLite

SQLite was chosen for simplicity — no server to run, a single file to manage. The repository abstraction means swapping to PostgreSQL requires only a new infrastructure implementation.

---

## Assumptions

- A single user (no authentication or multi-tenancy).
- "Todo" consists of at minimum: id, title, status (pending/completed), and timestamps.
- The SPA is served by the BFF in production (single deployable unit).
- Node.js 18+ is available in all target environments.

---

## Trade-offs

- **SQLite over PostgreSQL**: simplifies local setup at the cost of concurrent write limits — acceptable for this scope.
- **Monorepo (single repo, two packages)**: keeps things simple without the overhead of a full monorepo toolchain (Nx, Turborepo). Not ideal if the two packages need to scale independently.
- **BFF pattern**: adds a layer vs. the SPA hitting persistence directly, but enforces a clean API contract and keeps the frontend logic thin.
