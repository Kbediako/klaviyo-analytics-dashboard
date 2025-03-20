# Development Workflow

## Test-First Development (TDD)
1. Create a feature branch from `main` (e.g., `feature/backend-campaigns-endpoint`)
2. Write failing tests first
3. Write minimal code to pass the tests
4. Open a Pull Request to `main`
5. CI pipeline runs tests, linting, type checks
6. After all checks pass and code review, merge into `main`
7. Ensure files are lightweight, no more than 2-300 lines

## Version Control

### Commit Messages
- Use clear, descriptive commit messages
- Reference issue numbers when applicable
- Follow conventional commits pattern (optional)

### Branch Strategy
- `main` for production code
- Feature branches for development
- Consider release branches for major versions

## Project Structure

### Repository Layout
```
klaviyo-analytics-dashboard/
├── app/                # Next.js app directory
├── components/         # UI components
├── public/             # Static assets
├── styles/             # Global styles
├── analytics-dashboard.tsx # Main dashboard component
└── backend/            # Node.js/Express backend (API)
