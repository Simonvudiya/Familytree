# Contributing Guide

Thank you for your interest in contributing to Our Family History Platform! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect differing opinions and experiences

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Git
- Supabase CLI (for local development)

### Development Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/your-username/family-history-platform.git
cd family-history-platform

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Start local Supabase (optional but recommended)
supabase start

# 5. Apply migrations
supabase db push

# 6. Seed development data
supabase db seed

# 7. Generate TypeScript types
supabase gen types typescript --local > types/database.ts

# 8. Start development server
npm run dev
```

## Development Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions
- `chore/description` - Maintenance tasks

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting (no code change)
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Examples:
```
feat(stories): add version history diff view
fix(auth): resolve redirect loop after login
docs(api): update search endpoint documentation
refactor(components): extract common card layout
```

### Pull Request Process

1. **Create PR** from your feature branch to `main`
2. **Fill PR Template** with:
   - Description of changes
   - Related issue number
   - Screenshots (for UI changes)
   - Testing steps
3. **Automated Checks** must pass:
   - TypeScript compilation
   - ESLint
   - Prettier formatting
   - Unit tests
   - Build success
4. **Code Review** by at least one maintainer
5. **Address Feedback** with additional commits
6. **Squash and Merge** after approval

### PR Requirements
- [ ] Descriptive title and description
- [ ] Linked to issue (if applicable)
- [ ] All CI checks pass
- [ ] No merge conflicts
- [ ] Changes are focused and atomic
- [ ] Tests added for new functionality
- [ ] Documentation updated if needed
- [ ] No console.log or debug code

## Coding Standards

### TypeScript
- Strict mode enabled
- Explicit types for function parameters/returns
- Use `type` over `interface` for unions/primitives
- Prefer `unknown` over `any`
- Use type inference where clear

### React Components
- Server Components by default
- Client Components only when needed (`"use client"`)
- Component names: PascalCase
- File names: PascalCase for components, kebab-case for utilities
- Props interface named `ComponentNameProps`
- Destructure props in function signature

### Styling
- Tailwind CSS utility classes
- Custom CSS only in `globals.css`
- Use CSS variables for theming
- Mobile-first responsive design
- Dark mode support via `dark:` variant

### File Organization
```
components/
├── ComponentName/
│   ├── ComponentName.tsx
│   ├── ComponentName.test.tsx
│   ├── ComponentName.stories.tsx
│   └── index.ts
```

### Naming Conventions
- **Files**: PascalCase (components), kebab-case (utils, hooks)
- **Components**: PascalCase
- **Hooks**: camelCase with `use` prefix
- **Utilities**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase
- **Enums**: PascalCase singular

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

### Test Structure
```
tests/
├── unit/
│   ├── lib/
│   ├── hooks/
│   └── utils/
├── integration/
│   ├── api/
│   └── components/
└── e2e/
    ├── auth/
    ├── stories/
    └── compiler/
```

### Writing Tests
- Test behavior, not implementation
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test edge cases and error states

### Example Test
```typescript
// lib/utils.test.ts
import { formatDate, calculateReadingTime } from "@/lib/utils";

describe("formatDate", () => {
  it("formats date correctly", () => {
    expect(formatDate("2024-01-15")).toBe("January 15, 2024");
  });

  it("handles custom options", () => {
    expect(formatDate("2024-01-15", { month: "short" })).toBe("Jan 15, 2024");
  });
});
```

## Code Quality

### Linting & Formatting
```bash
# Run linter
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Format with Prettier
npx prettier --write .
```

### Type Checking
```bash
npm run typecheck
```

### Pre-commit Hooks
Husky runs on commit:
- ESLint
- Prettier
- Type checking
- Tests (staged files)

## Documentation

### Updating Documentation
- Update relevant `.md` files in `docs/`
- Update JSDoc comments for public APIs
- Update README for significant changes
- Add/update code examples

### Documentation Standards
- Clear, concise language
- Code examples for APIs
- Diagrams for architecture (Mermaid)
- Version-specific notes

## Release Process

### Versioning
Follow [Semantic Versioning](https://semver.org/):
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### Release Checklist
- [ ] All PRs merged for release
- [ ] Changelog updated
- [ ] Version bumped in `package.json`
- [ ] Tests passing
- [ ] Build successful
- [ ] Deploy to staging
- [ ] Staging verification
- [ ] Production deploy
- [ ] Release notes published
- [ ] Tag created

## Issue Reporting

### Bug Reports
Include:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos
- Environment (OS, browser, Node version)
- Error messages/logs

### Feature Requests
Include:
- Problem statement
- Proposed solution
- Alternatives considered
- User impact
- Implementation complexity estimate

### Security Issues
**DO NOT** create public issues for security vulnerabilities.
Email security@familyhistory.example.com instead.

## Community

### Communication Channels
- GitHub Discussions for questions
- Discord for real-time chat
- Monthly contributor calls
- Annual contributor summit

### Recognition
Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project website
- Annual contributors report

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Open a GitHub Discussion
- Join our Discord
- Email contributors@familyhistory.example.com