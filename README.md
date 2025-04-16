# Leap25 Backend

> [!IMPORTANT]
> READ the [Development Workflow](#development-workflow) for developers to see how to write tests along with your code

## Table of Contents

- [Setup](#setup)
- [Development](#development)
- [Testing & Code Quality](#testing--code-quality)
- [Development Workflow](#development-workflow)
  - [Test Driven Development (TDD) Workflow](#test-driven-development-tdd-workflow)
  - [Branch Strategy](#branch-strategy)
  - [Commit Guidelines](#commit-guidelines)
  - [Pre-commit Hooks](#pre-commit-hooks)
- [Contributing](#contributing)
- [CI/CD](#cicd)
- [Available Scripts](#available-scripts)
- [Need Help?](#need-help)

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
npm install -D vitest supertest @types/supertest eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier husky lint-staged @commitlint/cli @commitlint/config-conventional @eslint/js @eslint/eslintrc esbuild rimraf cross-env
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

## Development Workflow

1. Create a new branch from `main`:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and write tests for it (see [Test Driven Development/TDD](#test-driven-development-tdd-workflow) details below)

3. Lint, Format, and Test your changes:

```bash
npm run format
npm run lint
npm run lint:fix
npm test
```

4. Stage your changes and commit using [conventional commits](#commit-guidelines)

> [!NOTE]
> Upon committing, a check will be run to validate everything:
> `Husky triggers pre-commit hook --> linters, formatters, and tests runs --> commitlint checks commit message format --> if all passes, then commit succeeds` (try to run `git commit` in the terminal)

5. Push your changes to your branch and create a pull request

6. Ensure CI passes and get code review approval

- you can mention us in the pull request conversations so we can check your commits faster

---

### Test Driven Development (TDD) Workflow:

- **The directory structure for tests is expected to be:**

```txt
├── __tests__/         # Integration tests (required)
│   └── api/
├── controllers/
│   ├── __tests__/     # Controller unit tests (required)
│   └── ...
├── services/
│   ├── __tests__/     # Service unit tests (required)
│   └── ...
├── models/
│   ├── __tests__/     # Model unit tests (optional)
│   └── ...
├── utils/
│   ├── __tests__/     # Utility unit tests (optional)
│   └── ...
└── routes/
    ├── __tests__/     # Route unit tests (optional)
    └── ...
```

---

**1. Write a failing test first**

- this is only to make sure the testing suite is properly testing the modules
- name the test file with `<module>.<controller|service|integration>.test.ts` (ex. `user.service.test.ts`)

> [!IMPORTANT]
> Failing tests are removed right after running the initial test

> [!NOTE]
> see the provided example test file (ending with `.test.ts.example`)

---

**2. Write minimum code to make the test pass**

> [!IMPORTANT]
> Tests should be able to do _EXACTLY_ what it needs to do

- to run a specific test: `npm run test <path-to-test-file>`
- to run all tests: `npm run test`
- to run tests matching a specific name pattern, use the `-t` flag: `npm run test -t "should create a new user"`
- to run only integration tests: `npm run test:integration`
- to run only unit tests: `npm run test:unit`
- to run tests in watch mode for a specific file: `npm run test:watch <path-to-file>`

---

**3. Refactor while keeping tests green**

> [!NOTE]
> Always run the test for every logic change/addition you make

---

#### **Example workflow:**

```bash
# 1. Create a new feature branch
git checkout -b feature/user-registration

# 2. Run watch on tests
npm run test:watch

# 3. Write failing tests first (see .test.ts.example files)

# 4. Implement the feature until tests pass (don't forget to remove the failing tests after running them)

## to run a specific test:
npm run test <path-to-test-file>
### example:
npm run test __tests__/api/user.integration.test.ts

# 5. Refactor if needed

# 6. Run all tests
npm run test

# 7. Commit changes
git add .
git commit -m "feat: add user registration"
```

---

### Branch Strategy

- `main`: Production releases
- Feature branches: `feature/*`
- Bug fixes: `fix/*`

> [!NOTE]
> Production releases are automated via Github Actions

---

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

---

### Pre-commit Hooks

The repository is set up with Husky and lint-staged. Before each commit:

- Code will be automatically formatted
- Linting will be checked
- Tests will run for changed files

> [!NOTE]
> Commits will fail if tests fail or if commit messages don't follow conventions

---

## Contributing

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
