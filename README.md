# Leap25 Backend

## Setup

1. Clone the repository from `main`

```bash
git clone https://github.com/dlsu-lscs/leap25-backend.git
cd leap25-backend
```

2. Install dependencies: `npm install`

3. Copy `.env.example` to `.env` && configure environment variables

## Development

```bash
npm run dev
```

- dev dependencies:

```bash
npm install -D vitest supertest @types/supertest eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier husky lint-staged @commitlint/cli @commitlint/config-conventional @eslint/js @eslint/eslintrc esbuild
```

## Testing & Code Quality

- for local testing and running linters & formatters:

```bash
npm run lint
npm run lint:fix
npm run format
npm test
```

- run tests in watch mode:

```bash
npm run test:watch
```

## Git Workflow

### Branch Strategy

- `main`: Production releases
- Feature branches: `feature/*`
- Bug fixes: `fix/*`

> [!NOTE]
> Production releases are automated via Github Actions

### Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/). Your commits must follow this format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or modifying tests
- `chore`: Changes to build process or auxiliary tools

Examples:

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login validation issue"
git commit -m "docs: update API documentation"
git commit -m "style: format user controller"
```

### Pre-commit Hooks

The repository is set up with Husky and lint-staged. Before each commit:

- Code will be automatically formatted
- Linting will be checked
- Tests will run for changed files

> [!NOTE]
> Commits will fail if tests fail or if commit messages don't follow conventions

## Contributing

1. Create a new branch from `main`:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes, following our code style guidelines

3. Test your changes:

```bash
npm run lint
npm test
```

4. Commit your changes using conventional commits

5. Push and create a pull request

6. Ensure CI passes and get code review approval

## CI/CD

GitHub Actions will automatically:

- Run tests
- Check code formatting
- Verify commit message format
- Run linting checks

> [!IMPORTANT]
> Pull requests cannot be merged if CI checks fail

## Available Scripts

- `npm run dev` - start development server
- `npm start` - start production server
- `npm test` - run tests
- `npm run test:watch` - run tests in watch mode
- `npm run test:coverage` - run tests with coverage report
- `npm run lint` - check linting
- `npm run lint:fix` - fix linting issues
- `npm run format` - format code

## Need Help?

Check the following resources:

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
