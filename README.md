# SwissGrid

A minimal monorepo application built with modern web technologies.

## 🏗️ Architecture

This project follows a monorepo structure with separate client and server applications:

```
SwissGrid/
├── client/          # React frontend
├── server/          # Node.js backend
├── .github/         # CI/CD workflows
└── README.md        # This file
```

## 🛠️ Tech Stack

### Frontend (`/client`)

- **React 18** - Modern React with concurrent features
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript

### Backend (`/server`)

- **Node.js 18** - JavaScript runtime
- **Fastify** - Fast and efficient web framework
- **TypeScript** - Type-safe server development
- **MongoDB** - NoSQL database

### DevOps

- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- Docker (optional)

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/mdaashir/SwissGrid.git
    cd SwissGrid
    ```

2. Install all dependencies:

    ```bash
    npm run install:all
    ```

    Or install dependencies individually:

    ```bash
    # Install root dependencies
    npm install

    # Install client dependencies
    cd client
    npm install

    # Install server dependencies
    cd ../server
    npm install
    ```

### Development

Start the development servers:

```bash
# Option 1: Start both services with concurrently
npm run dev

# Option 2: Start individual services
npm run dev:client  # Start React client only
npm run dev:server  # Start Fastify server only

# Option 3: Use development scripts
./dev.sh           # Linux/macOS
.\dev.ps1          # Windows PowerShell

# Option 4: Use Docker
docker-compose up --build
```

### Testing

Run tests for both applications:

```bash
# Run all tests
npm test

# Run individual tests
npm run test:client
npm run test:server

# Run with coverage
cd server && npm run test:coverage
```

### Code Quality

Linting and formatting:

```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Format all code
npm run format

# Check formatting
cd client && npm run format:check
cd server && npm run format:check
```

### Building

Build the applications:

```bash
# Build both applications
npm run build

# Build individually
npm run build:client
npm run build:server
```

## 📦 Docker

Build and run with Docker:

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Or use npm scripts
npm run docker:up
npm run docker:down
npm run docker:logs
```

## 🧹 Maintenance

Clean up dependencies and build artifacts:

```bash
npm run clean  # Remove all node_modules and dist folders
```

## 📁 Project Scripts

Available npm scripts in root directory:

- `npm run dev` - Start both client and server concurrently
- `npm run build` - Build both applications
- `npm test` - Run all tests
- `npm run lint` - Lint all code
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format all code
- `npm run install:all` - Install all dependencies
- `npm run clean` - Clean all build artifacts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

This project is licensed under the terms specified in the LICENSE file.
