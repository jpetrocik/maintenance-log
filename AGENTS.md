# AGENTS.md - Guidelines for Agentic Coding in Maintenance Log Repo

This file provides essential commands and code conventions for AI coding agents working in this repository. The project consists of two main parts:
- **Frontend (www/)**: Angular 21 application
- **Backend (server/)**: Node.js/Express/TypeScript API server with MySQL

Always work in the appropriate subdirectory (cd www or cd server). Use `workdir` in Bash tool for commands.

## 🚀 Build, Lint, Test Commands

### Frontend (www/)
```
# Development server
cd www &amp;&amp; npm start  # or npm run ng serve

# Production build
cd www &amp;&amp; npm run build

# Development build (watch mode)
cd www &amp;&amp; npm run watch

# Run all tests (Karma + Jasmine)
cd www &amp;&amp; npm run test  # Runs `ng test`

# Run a single test file
cd www &amp;&amp; ng test --include=src/app/**/some.component.spec.ts

# Run tests with code coverage
cd www &amp;&amp; ng test --code-coverage

# Typecheck (Angular CLI handles it)
cd www &amp;&amp; ng build --prod=false  # Fails on TS errors

# Lint\ncd www &amp;&amp; npm run lint\n# Lint fix\ncd www &amp;&amp; npm run lint -- --fix
```

**Notes**:
- Tests use Jasmine/Karma. Watch mode: `ng test --watch`.
- No custom lint script; rely on `tsconfig.json` strict mode.
- Serve built app: Use `ng serve --prod` or static server.

### Backend (server/)
```
# Development server (with hot reload)
cd server &amp;&amp; npx ts-node-dev --respawn src/index.ts

# Typecheck only (noEmit)
cd server &amp;&amp; npx tsc --noEmit

# Build to JS
cd server &amp;&amp; npx tsc

# Run built JS
cd server &amp;&amp; node bin/index.js

# Tests (Placeholder; add Jest)
cd server &amp;&amp; npm test  # Currently echoes error

# Run single test (once Jest added)
cd server &amp;&amp; npx jest src/some.test.ts
```

**Notes**:
- ESLint + typescript-eslint added. Jest recommended.
- MySQL deps: `mysql2`. Ensure DB running (maintenance.sql).
- Nodemailer/Plivo for emails/SMS.

### Root/Global Commands
```
# Git status
git status

# Install deps (run in both subdirs)
cd www &amp;&amp; npm ci
cd server &amp;&amp; npm ci

# Pre-commit: Run typecheck + tests in both
# (Add to .git/hooks/pre-commit)
```

## 💻 Code Style Guidelines

Follow these strictly to match existing code. Mimic patterns from `src/` files.

### General
- **Indentation**: 2 spaces (from .editorconfig)
- **Quotes**: Single quotes `' '` for TS/JS (`.editorconfig [*.ts]`)
- **Line endings**: LF
- **Trailing whitespace**: Trim (editorconfig)
- **Final newline**: Yes
- **Max line length**: 100 chars (soft); no hard rule
- **No comments** unless explanatory (agents: NO ***ANY*** comments unless asked)

### TypeScript (Both Frontend/Backend)
- **Strict mode**: Follow tsconfig:
  - Frontend: `strict: true`, `noImplicitReturns: true`, etc.
  - Backend: `strict: true`, `strictNullChecks: true`, `noImplicitAny: false`
- **Typing**: Always type params/returns. Use `unknown` over `any` where possible.
- **Interfaces**: Prefer over types for objects.
```
interface User {
  id: number;
  name: string;
}
```
- **Null/Undefined**: Use `?` optional; narrow with guards.
- **Enums**: Const assertions for string enums.
```
const UserRole = {
  ADMIN: 'admin' as const,
} satisfies Record&lt;string, string&gt;;
```

### Naming Conventions
- **Variables/Functions**: camelCase (`userService`, `getUserById`)
- **Classes/Components**: PascalCase (`UserComponent`, `AuthService`)
- **Constants**: UPPER_SNAKE_CASE or `const camelName = 'value' as const`
- **Files**:
  - Frontend: `*.component.ts`, `*.service.ts`, `*.spec.ts`
  - Backend: `*.ts` (e.g., `routes/users.ts`, `services/email.ts`)
- **Imports**: Relative paths; group &amp; sort:
```
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user.service';
import type { User } from '../models/user';
```

### Imports & Organization
- **Angular (Frontend)**:
  1. Angular core
  2. Angular modules
  3. Material/RxJS
  4. Local services/models
  5. Side-effect imports last
- **Node.js (Backend)**:
```
import express from 'express';
import mysql from 'mysql2/promise';
// Local
import { dbConfig } from '../config/db';
```
- **Barrel exports**: Use `index.ts` for public APIs.
- **No unused imports** (TS will error).

### Formatting (EditorConfig + Inferred)
- **Angular templates**: Use structural directives; self-closing tags.
- **No semicolons**? Match existing (check files).
- **Async/Await**: Prefer over promises.
```
async function fetchUser(id: number): Promise&lt;User | null&gt; {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] as User | null;
  } catch (error) {
    console.error('DB error:', error);
    throw error;
  }
}
```

### Error Handling
- **Frontend**:
  - HttpInterceptor for global errors.
  - RxJS `catchError`.
  - User-friendly messages (no stack traces).
```
catchError((err) =&gt; {
  console.error('API Error:', err);
  return of(null);
})
```
- **Backend**:
  - Try/catch all async.
  - Express error middleware.
  - HTTP status: 400 bad req, 404 not found, 500 server err.
  - Log with `console.error`; no sensitive data.
```
app.use((err: Error, req: Request, res: Response, next: NextFunction) =&gt; {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});
```
- **DB Queries**: Use parameterized queries (mysql2).

### Angular-Specific (www/src/app)
- **Components**: Standalone? No (legacy). OnPush change detection.
- **Services**: Injectable, providedIn: 'root'.
- **Routing**: Lazy-loaded modules.
- **Material**: Theme consistent; elevation.
- **Forms**: ReactiveFormsModule preferred.
- **Tests**: Shallow testing; mock services.

```
@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent {
  users$ = this.userService.users$;
}
```

### Backend-Specific (server/src)
- **Express**: Router modular (`routes/`). Middleware order: bodyParser &gt; auth &gt; routes &gt; error.
- **DB**: Connection pool (mysql2/promise).
- **Auth**: JWT? None yet; add sessions/cookies.
- **Emails/SMS**: Nodemailer/Plivo; env vars for creds.
- **Config**: `config/` folder, process.env.

### Security Best Practices
- **No secrets in code**: Use .env (gitignore'd).
- **Input validation**: Joi/Zod or express-validator.
- **SQL**: Always parameterized.
- **Rate limiting**: helmet, cors.
- **HTTPS**: In prod.

### Testing Guidelines
- **Frontend**: ComponentHarness for e2e; Jasmine describe/it/expect.
```
it('should create', () =&gt; {
  expect(component).toBeTruthy();
});
```
- **Backend**: Supertest + Jest (add it).
- **Run after changes**: `npm run test` + typecheck.

### Verification Workflow for Agents
1. Read relevant files first.
2. Edit with exact matches (preserve indent).
3. Run typecheck: `npx tsc --noEmit`
4. Run tests/lint.
5. No commits unless asked.

**Length: ~170 lines. Update as project evolves.**