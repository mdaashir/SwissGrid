# ESLint & Prettier Setup Guide

This document outlines the ESLint and Prettier configuration for the SwissGrid monorepo.

## 🛠️ Setup Overview

### Root Level Configuration
- **ESLint**: `.eslintrc.js` - Base configuration for TypeScript
- **Prettier**: `.prettierrc` - Code formatting rules
- **Husky**: `.husky/` - Git hooks for pre-commit linting and testing
- **Lint-Staged**: `.lintstagedrc` - Run linters on staged files

### Client Configuration
- **ESLint**: `client/.eslintrc.cjs` - React + TypeScript rules
- **Testing**: Vitest with React Testing Library
- **Types**: React, DOM, and testing types

### Server Configuration
- **ESLint**: `server/.eslintrc.js` - Node.js + TypeScript + Jest rules
- **Testing**: Jest with TypeScript support
- **Types**: Node.js and Jest types

## 🚀 Installation & Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 2. Initialize Husky (one-time setup)

```bash
npm run prepare
```

### 3. Make Husky hooks executable (Unix/macOS)

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

## 📋 Available Scripts

### Root Level Scripts

```bash
# Linting
npm run lint              # Lint both client and server
npm run lint:fix          # Auto-fix lint issues

# Formatting
npm run format            # Format all files with Prettier
npm run format:check      # Check if files are formatted

# Testing
npm run test              # Run all tests
```

### Client Scripts

```bash
cd client

# Linting & Formatting
npm run lint              # Lint TypeScript/React files
npm run lint:fix          # Auto-fix lint issues
npm run format            # Format source files
npm run format:check      # Check formatting

# Testing
npm run test              # Run Vitest tests
npm run test:ui           # Run tests with UI
```

### Server Scripts

```bash
cd server

# Linting & Formatting
npm run lint              # Lint TypeScript files
npm run lint:fix          # Auto-fix lint issues
npm run format            # Format source files
npm run format:check      # Check formatting

# Testing
npm run test              # Run Jest tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage
```

## 🔧 Configuration Details

### ESLint Rules

#### Root Configuration (`.eslintrc.js`)
- TypeScript support
- Import ordering
- Prettier integration
- No console warnings (for Node.js)

#### Client Configuration (`client/.eslintrc.cjs`)
- React 18 support (with new JSX transform)
- React Hooks rules
- Testing Library rules
- Jest DOM rules
- Browser environment

#### Server Configuration (`server/.eslintrc.js`)
- Node.js environment
- Jest testing rules
- Server-specific TypeScript rules
- Console allowed for server logging

### Prettier Configuration (`.prettierrc`)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### Husky Pre-commit Hook

The pre-commit hook runs:
1. **lint-staged**: Lints and formats only staged files
2. **npm test**: Runs all tests

### Lint-Staged Configuration (`.lintstagedrc`)

```json
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md}": ["prettier --write"],
  "client/**/*.{ts,tsx}": ["npm run lint:fix --prefix client"],
  "server/**/*.{js,ts}": ["npm run lint:fix --prefix server"]
}
```

## 🎯 IDE Integration

### VS Code Settings (`.vscode/settings.json`)

- Auto-format on save
- ESLint auto-fix on save
- Proper working directories for monorepo
- File exclusions for performance

### Recommended Extensions (`.vscode/extensions.json`)

- Prettier - Code formatter
- ESLint
- TypeScript and JavaScript support
- Jest testing support

## 🚨 Common Issues & Solutions

### 1. ESLint not working in monorepo

**Problem**: ESLint not recognizing workspace structure

**Solution**: Check VS Code settings:
```json
{
  "eslint.workingDirectories": ["client", "server"]
}
```

### 2. Prettier conflicts with ESLint

**Problem**: Formatting rules conflict

**Solution**: We use `eslint-config-prettier` to disable conflicting rules

### 3. Pre-commit hook fails

**Problem**: Tests or linting fail during commit

**Solution**:
```bash
# Fix linting issues
npm run lint:fix

# Run tests to see failures
npm run test

# Skip hooks temporarily (not recommended)
git commit --no-verify
```

### 4. Husky hooks not executable

**Problem**: Permission denied on Git hooks

**Solution** (Unix/macOS):
```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### 5. TypeScript errors in tests

**Problem**: Test files have TypeScript errors

**Solution**: Check tsconfig includes test types:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

## 🔄 Workflow

### Daily Development

1. **Start development**: `npm run dev:client` & `npm run dev:server`
2. **Write code**: ESLint and Prettier will highlight issues in VS Code
3. **Save files**: Auto-format and auto-fix on save
4. **Before commit**: Pre-commit hooks run automatically
5. **Commit**: Only clean, tested code gets committed

### Code Review Process

1. **Consistent formatting**: Prettier ensures consistent style
2. **Quality checks**: ESLint catches common issues
3. **Test coverage**: Tests run on every commit
4. **Review focus**: Reviewers can focus on logic, not style

## 🎛️ Customization

### Adding New ESLint Rules

1. **Root rules**: Edit `.eslintrc.js`
2. **Client rules**: Edit `client/.eslintrc.cjs`
3. **Server rules**: Edit `server/.eslintrc.js`

### Changing Prettier Settings

Edit `.prettierrc` and run:
```bash
npm run format
```

### Adding New Pre-commit Checks

Edit `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Add new checks here
npm run type-check
npm run lint:fix
npm run test
```

## 📚 Resources

- [ESLint Documentation](https://eslint.org/docs/)
- [Prettier Documentation](https://prettier.io/docs/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [React ESLint Plugin](https://github.com/jsx-eslint/eslint-plugin-react)
- [Jest ESLint Plugin](https://github.com/jest-community/eslint-plugin-jest)
