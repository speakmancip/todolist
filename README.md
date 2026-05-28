# Todo List Application

A full-stack todo list application built across three independently deployable layers, following Domain-Driven Design (DDD) and 12-factor app principles.

---

## Architecture

```
Browser (React SPA, port 5173)
        │
        │  HTTP REST  ·  Authorization: Bearer <token>
        ▼
BFF — Backend for Frontend (Express, port 3002)
        │  Thin proxy — no business logic, no JWT secret
        │  Forwards Authorization header verbatim
        ▼
Backend Service (Express, port 3001)
        │  DDD layers · JWT authentication · SQLite persistence
        ▼
    todos.db  (SQLite — path configured via DB_PATH env var)
```

### Package Layout

```
todolist/
├── package.json       # Root — convenience scripts only (no shared code)
├── backend/           # Core business logic — DDD + 12-factor
├── bff/               # Backend for Frontend — Express proxy
└── frontend/          # React SPA — communicates only with the BFF
```

### Backend DDD Layers (`backend/src/`)

| Layer | Path | Responsibility |
|-------|------|----------------|
| **Domain** | `domain/` | Entities, value objects, repository interfaces — zero I/O |
| **Application** | `application/` | Use cases — orchestrate domain logic, delegate I/O to repositories |
| **Interface** | `interface/` | Express routes, controllers, middleware — HTTP in/out only |
| **Infrastructure** | `infrastructure/` | SQLite repositories, JWT, bcrypt, structured logger |

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| UC-01 | Login | Authenticate with email and password; receive a JWT |
| UC-02/03 | Login — bad credentials | Generic "Incorrect credentials" message (no field hint) |
| UC-04 | Create todo | Add a todo with title, optional description, and optional due date |
| UC-05 | Create todo — missing title | Inline validation error before API call |
| UC-06 | View todo | Click a todo title to see full details |
| UC-07 | Edit todo | Update title, description, or due date |
| UC-08 | Edit todo — description too long | Error shown when description exceeds 1000 characters |
| UC-09 | Delete todo — confirmed | Confirmation dialog; todo removed from list on confirm |
| UC-10 | Delete todo — cancelled | Dismissible "Deletion cancelled" info banner |
| — | Register | Create a new account from the register page |
| — | Complete / Incomplete | Toggle the completion status of any todo |
| — | List view | Todos displayed with title, completion status, and due date |

---

## REST API

All `/todos` endpoints require an `Authorization: Bearer <token>` header.

| Method | Path | Auth | Description |
|--------|------|:----:|-------------|
| `POST` | `/auth/register` | | Create a user account; returns a JWT |
| `POST` | `/auth/login` | | Validate credentials; returns a JWT |
| `GET` | `/todos` | ✓ | List all todos for the authenticated user |
| `POST` | `/todos` | ✓ | Create a todo |
| `GET` | `/todos/:id` | ✓ | Fetch a single todo |
| `PUT` | `/todos/:id` | ✓ | Update title, description, and/or due date |
| `DELETE` | `/todos/:id` | ✓ | Permanently delete a todo (returns 204) |
| `PATCH` | `/todos/:id/complete` | ✓ | Mark a todo as completed |
| `PATCH` | `/todos/:id/incomplete` | ✓ | Mark a completed todo as incomplete |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v22 LTS or later
- npm v10 or later

---

## Build & Run

### 1. Clone the repository

```bash
git clone https://github.com/speakmancip/todolist.git
cd todolist
```

### 2. Configure environment variables

Each package has a `.env.example` — copy and edit before running:

```bash
cp backend/.env.example backend/.env
cp bff/.env.example     bff/.env
cp frontend/.env.example frontend/.env
```

**`backend/.env`**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Port the backend listens on |
| `DB_PATH` | `./data/todos.db` | SQLite database file path |
| `JWT_SECRET` | *(required)* | Secret used to sign and verify JWTs |
| `JWT_EXPIRES_IN` | `1h` | JWT expiry duration |

**`bff/.env`**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | Port the BFF listens on |
| `BACKEND_URL` | `http://localhost:3001` | Base URL of the backend service |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed SPA origin for CORS |

**`frontend/.env`**

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_BFF_URL` | `http://localhost:3002` | BFF base URL (must be reachable from the browser) |

### 3. Install all dependencies

```bash
npm run install:all
```

Or install each package individually:

```bash
npm install --prefix backend
npm install --prefix bff
npm install --prefix frontend
```

### 4. Run in development (three terminals)

```bash
# Terminal 1 — Backend (http://localhost:3001)
npm run dev:backend

# Terminal 2 — BFF (http://localhost:3002)
npm run dev:bff

# Terminal 3 — React SPA (http://localhost:5173)
npm run dev:frontend
```

Then open `http://localhost:5173` in your browser.

### 5. Run in production

```bash
# Build the React SPA into static files
npm run build:frontend

# Start the backend and BFF (each in their own process or container)
node backend/src/server.js    # port 3001
node bff/src/server.js        # port 3002
```

Serve the built `frontend/dist/` directory with any static file host (Nginx, a CDN, or a GCP Cloud Storage bucket) and point `VITE_BFF_URL` at the deployed BFF.

### 6. Validate the full stack (install + test + build)

```bash
npm run validate
```

Installs all dependencies, runs all tests across all three packages, and builds the frontend. This is the single green-gate — if it passes, the stack is wired up correctly.

---

## Running the Tests

Tests are written with [Jest](https://jestjs.io/).

### Run all tests (all packages)

```bash
npm run test:all
```

### Run tests per package

```bash
npm test --prefix backend    # unit + integration tests
npm test --prefix bff        # BFF integration tests
npm test --prefix frontend   # React component tests
```

### Run with coverage

```bash
cd backend && npm run test:coverage
cd frontend && npm run test:coverage
```

---

## Testing Strategy

| Layer | Test type | Tooling | Isolation approach |
|-------|-----------|---------|-------------------|
| Backend — domain | Unit | Jest | None — pure functions, no I/O |
| Backend — application | Unit | Jest | `jest.fn()` mocks for repository interfaces |
| Backend — interface | Integration | Jest + supertest | In-memory SQLite (`new Database(':memory:')`) |
| BFF | Integration | Jest + supertest | `jest.mock('./httpClient')` — no real backend |
| Frontend | Component | RTL + Jest | `jest.mock('../api/todos')` — no real BFF |

The layered approach means the vast majority of business logic is covered by fast, dependency-free unit tests. Integration tests are reserved for verifying HTTP contracts at the entry points of each service.

---

## Design Choices

### Domain-Driven Design

The backend is structured around a strict DDD boundary:

- **`Todo`** is the primary aggregate root. Its invariants (title required, description ≤ 1000 chars) are enforced inside the entity factory — not in controllers or database code.
- **Use cases** in the application layer orchestrate domain logic and delegate all persistence to repository *interfaces*. The domain layer has zero knowledge of SQLite.
- **Repository implementations** live entirely in the infrastructure layer — swapping SQLite for PostgreSQL requires only a new infrastructure implementation, no domain or application changes.

### 12-Factor Compliance

| Factor | Applied |
|--------|---------|
| **III — Config** | All environment-specific values injected via `.env` / environment variables |
| **IV — Backing services** | SQLite treated as an attached resource; path is configurable |
| **VI — Processes** | All three services are stateless — no in-process session state |
| **XI — Logs** | Structured JSON logs written to stdout by the backend |

### BFF Pattern

The BFF sits between the SPA and the backend, providing a single origin for the browser to call. It forwards requests and the `Authorization` header verbatim — it has no JWT secret and cannot validate tokens. This keeps the frontend logic thin and the backend the sole authority on auth.

### Consistent Domain Naming

All three layers use identical terminology for the same concept (e.g., `Todo`, `userId`, `emailAddress`, `isCompleted`, `dueDate`). This allows a concept to be traced from the database column to the UI without translation — important for maintainability and for learners reading the code.

### SQLite

Chosen for simplicity — no server to run, a single file to manage. The repository abstraction means the persistence layer can be replaced without touching domain or application code.

---

## Assumptions

- Single-user per session — authentication is per-user but there is no admin or multi-tenant concept.
- Node.js 22 LTS is available in all target environments (compatible with GCP Cloud Run and App Engine).
- `title` is the only required field on a `Todo`; `description` and `dueDate` are optional.
- The SPA, BFF, and backend are configured to allow cross-origin communication in production via `CORS_ORIGIN` and `VITE_BFF_URL`.

---

## Trade-offs

| Decision | Trade-off |
|----------|-----------|
| SQLite over PostgreSQL | Simpler local setup; concurrent write limits not a concern at this scale |
| Three separate packages (no monorepo toolchain) | Straightforward without Nx/Turborepo overhead; not ideal if packages need to scale independently |
| No shared code package | Each service is self-contained and independently deployable; small amount of duplication accepted |
| BFF as pure proxy | Adds a network hop; benefit is a clean API contract and a thin, predictable frontend |
| JWT in React state (not localStorage) | Tokens lost on page refresh (user must re-login); mitigates XSS risk from localStorage |
