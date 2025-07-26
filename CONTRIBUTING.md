# Contributing to CultureMade

Welcome to the CultureMade project! We're excited to have you contribute to our innovative e-commerce platform. This guide will help you understand our development process, coding standards, and quality requirements.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Code Quality Standards](#code-quality-standards)
- [Git Workflow](#git-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Review Guidelines](#code-review-guidelines)
- [Testing Standards](#testing-standards)
- [Documentation Standards](#documentation-standards)
- [Troubleshooting](#troubleshooting)

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 9 or higher
- **Git**: Latest version
- **VS Code**: Recommended editor with our extension pack

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/culturemade.git
   cd culturemade
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **VS Code Setup**
   - Install recommended extensions (VS Code will prompt you)
   - Reload VS Code to activate all extensions

## 🔧 Development Environment

### Required Tools

Our development environment includes several quality tools that run automatically:

- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Git hooks
- **lint-staged**: Pre-commit file processing
- **commitlint**: Commit message validation

### VS Code Integration

We provide comprehensive VS Code settings that include:

- Auto-formatting on save
- Auto-fixing ESLint issues
- Import organization
- TypeScript integration
- Tailwind CSS IntelliSense
- Recommended extensions

## 📏 Code Quality Standards

### TypeScript Standards

- **Strict Mode**: All TypeScript files must pass strict type checking
- **No Implicit Any**: Explicit typing is required
- **Null Safety**: Proper handling of null and undefined values
- **Interface Definitions**: Use interfaces for object types
- **Type Exports**: Export types from dedicated files

### Code Style

- **Prettier Configuration**: 80-character line width, 2-space indentation
- **Import Organization**: Automatic import sorting and grouping
- **Naming Conventions**:
  - Components: PascalCase
  - Functions: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Files: kebab-case or PascalCase for components

### React Best Practices

- **Functional Components**: Use function components with hooks
- **TypeScript Props**: Define prop types with interfaces
- **Component Organization**: One component per file
- **Hook Usage**: Follow React hooks rules
- **Performance**: Use React.memo, useMemo, useCallback appropriately

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   ├── forms/          # Form components
│   └── layouts/        # Layout components
├── pages/              # Next.js pages
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── types/              # TypeScript type definitions
├── styles/             # Global styles
└── utils/              # Utility functions
```

## 🔄 Git Workflow

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: New features (`feature/user-authentication`)
- **bugfix/**: Bug fixes (`bugfix/cart-calculation`)
- **hotfix/**: Critical production fixes

### Branch Naming

- Use kebab-case for branch names
- Include issue numbers when applicable
- Be descriptive but concise

Examples:
- `feature/product-search`
- `bugfix/checkout-validation`
- `hotfix/payment-processing`

## 📝 Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for consistent commit messages.

### Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system changes
- **ci**: CI configuration changes
- **chore**: Other changes (maintenance, etc.)

### Commit Format

```
type(scope): description

[optional body]

[optional footer]
```

### Examples

```bash
feat(auth): add user authentication system

Implement complete user authentication with:
- Login/logout functionality
- Password reset flow
- Session management
- Protected routes

Closes #123
```

```bash
fix(cart): resolve quantity update issue

Fix bug where cart quantity wasn't updating properly
when user clicked increment/decrement buttons.

Fixes #456
```

### Commit Validation

Our commit messages are automatically validated using commitlint. Invalid commits will be rejected.

## 🔍 Pull Request Process

### Before Creating a PR

1. **Sync with main**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-branch
   git rebase main
   ```

2. **Run Quality Checks**
   ```bash
   npm run lint
   npm run type-check
   npm run format:check
   ```

3. **Test Your Changes**
   ```bash
   npm run test
   npm run build
   ```

### PR Requirements

- **Descriptive Title**: Clear, concise description of changes
- **Detailed Description**: What, why, and how of your changes
- **Issue Reference**: Link to related issues
- **Screenshots**: For UI changes
- **Testing Notes**: How to test the changes
- **Breaking Changes**: Document any breaking changes

### PR Template

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] Tests added/updated
```

## 👥 Code Review Guidelines

### For Authors

- **Self-Review**: Review your own code before requesting review
- **Small PRs**: Keep PRs focused and reasonably sized
- **Context**: Provide sufficient context in PR description
- **Respond Promptly**: Address feedback in a timely manner
- **Test Coverage**: Ensure adequate test coverage

### For Reviewers

- **Be Constructive**: Focus on code improvement, not criticism
- **Ask Questions**: Seek clarification when needed
- **Suggest Improvements**: Provide actionable feedback
- **Approve Responsibly**: Ensure code meets quality standards
- **Review Thoroughly**: Check logic, performance, and security

### Review Checklist

- [ ] Code follows project conventions
- [ ] Logic is correct and efficient
- [ ] Error handling is appropriate
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Tests are comprehensive
- [ ] Documentation is updated

## 🧪 Testing Standards

### Test Types

- **Unit Tests**: Test individual functions/components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Test application performance

### Testing Requirements

- **Minimum Coverage**: 80% code coverage required
- **Test Naming**: Descriptive test names
- **Test Organization**: Group related tests
- **Mock Strategy**: Use mocks appropriately
- **Edge Cases**: Test error conditions and edge cases

### Testing Commands

```bash
npm run test              # Run all tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage
npm run test:e2e          # Run end-to-end tests
```

## 📚 Documentation Standards

### Code Documentation

- **Comments**: Explain complex logic and business rules
- **JSDoc**: Document functions and classes
- **README**: Keep project README updated
- **API Documentation**: Document API endpoints
- **Type Documentation**: Document complex types

### Documentation Requirements

- **API Changes**: Document all API changes
- **Breaking Changes**: Document breaking changes
- **Migration Guides**: Provide migration guides when needed
- **Examples**: Include usage examples
- **Architecture**: Document architectural decisions

## 🔧 Troubleshooting

### Common Issues

#### ESLint Issues
```bash
# Fix formatting issues
npm run lint:fix

# Check specific files
npx eslint src/components/MyComponent.tsx
```

#### TypeScript Issues
```bash
# Check types
npm run type-check

# Check specific file
npx tsc --noEmit src/components/MyComponent.tsx
```

#### Prettier Issues
```bash
# Format all files
npm run format

# Format specific files
npx prettier --write src/components/MyComponent.tsx
```

#### Husky Issues
```bash
# Reinstall husky hooks
npm run prepare

# Check hook files
ls -la .husky/
```

### Getting Help

- **GitHub Issues**: Create an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Request help during code review
- **Documentation**: Check existing documentation first

## 📋 Quality Checklist

Before submitting your contribution:

- [ ] Code follows TypeScript strict mode
- [ ] All ESLint rules pass
- [ ] Code is formatted with Prettier
- [ ] Type checking passes
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Commit messages follow conventional format
- [ ] PR description is complete
- [ ] Self-review completed

## 🎯 Performance Guidelines

### Code Performance

- **Bundle Size**: Keep bundle size minimal
- **Lazy Loading**: Use dynamic imports for large components
- **Memoization**: Use React.memo, useMemo, useCallback
- **Image Optimization**: Use Next.js Image component
- **API Optimization**: Minimize API calls

### Build Performance

- **Development**: Fast development builds
- **Production**: Optimized production builds
- **Caching**: Proper caching strategies
- **Tree Shaking**: Ensure dead code elimination

## 🚀 Deployment Guidelines

### Pre-Deployment Checklist

- [ ] All tests pass
- [ ] Build succeeds
- [ ] Performance metrics acceptable
- [ ] Security scan passes
- [ ] Documentation updated
- [ ] Environment variables configured

### Deployment Process

1. **Staging Deployment**: Test in staging environment
2. **Performance Testing**: Verify performance metrics
3. **Security Review**: Complete security checklist
4. **Production Deployment**: Deploy to production
5. **Post-Deployment**: Monitor for issues

## 🤝 Community Guidelines

### Code of Conduct

- **Be Respectful**: Treat all contributors with respect
- **Be Inclusive**: Welcome developers of all backgrounds
- **Be Constructive**: Provide helpful feedback
- **Be Patient**: Remember everyone is learning
- **Be Professional**: Maintain professional communication

### Communication

- **GitHub Issues**: For bugs and feature requests
- **Pull Requests**: For code contributions
- **Discussions**: For questions and ideas
- **Code Reviews**: For code feedback

Thank you for contributing to CultureMade! Your contributions help build an amazing e-commerce platform. 🎉
