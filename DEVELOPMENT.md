# SwissGrid Development Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use Docker
- **Git** - [Download](https://git-scm.com/)
- **Docker** (optional) - [Download](https://docker.com/)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/mdaashir/SwissGrid.git
cd SwissGrid

# Install all dependencies
npm run install:all
```

### 2. Environment Configuration

```bash
# Copy environment files
cp client/.env.example client/.env
cp server/.env.example server/.env

# Edit the .env files with your configuration
```

### 3. Start Development

#### Option A: Individual Services

```bash
# Terminal 1 - Start MongoDB (if not using Docker)
mongod

# Terminal 2 - Start server
npm run dev:server

# Terminal 3 - Start client
npm run dev:client
```

#### Option B: Docker (Recommended)

```bash
docker-compose up --build
```

#### Option C: Development Scripts

```bash
# Windows PowerShell
.\dev.ps1

# macOS/Linux
chmod +x dev.sh
./dev.sh
```

## 🏗️ Project Structure

```
SwissGrid/
├── client/                 # React 18 + Vite frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── ...
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
├── server/                 # Node.js 18 + Fastify backend
│   ├── src/
│   │   ├── index.ts
│   │   ├── db/
│   │   │   └── connection.ts
│   │   └── ...
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── Dockerfile
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI/CD
├── docker-compose.yml      # Docker configuration
├── package.json            # Root workspace configuration
└── README.md
```

## 🛠️ Available Scripts

### Root Level

- `npm run install:all` - Install all dependencies
- `npm run dev:client` - Start client development server
- `npm run dev:server` - Start server development server
- `npm run build:client` - Build client for production
- `npm run build:server` - Build server for production
- `npm run test` - Run all tests
- `npm run clean` - Clean all node_modules and build outputs

### Client (`/client`)

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run Vitest tests

### Server (`/server`)

- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run Jest tests

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run client tests only
npm run test:client

# Run server tests only
npm run test:server

# Watch mode (in respective directories)
cd client && npm test
cd server && npm run test:watch
```

## 🐳 Docker Development

### Full Stack with Docker Compose

```bash
# Start all services
docker-compose up

# Start with rebuild
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Containers

```bash
# Build client image
docker build -t swissgrid-client ./client

# Build server image
docker build -t swissgrid-server ./server

# Run MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

## 🔧 Configuration

### Environment Variables

#### Client (`.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=SwissGrid
```

#### Server (`.env`)

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/swissgrid
DB_NAME=swissgrid
```

### MongoDB Setup

#### Local Installation

1. Install MongoDB Community Server
2. Start MongoDB service
3. Connect using default URI: `mongodb://localhost:27017`

#### Docker

```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=example \
  mongo:7.0
```

## 🚀 Deployment

### Building for Production

```bash
# Build both client and server
npm run build:client
npm run build:server

# Or with Docker
docker-compose -f docker-compose.prod.yml up --build
```

### CI/CD

The project includes GitHub Actions workflow (`.github/workflows/ci.yml`) that:

- Runs tests on Node.js 18.x and 20.x
- Tests with MongoDB service
- Builds both client and server
- Runs linting and type checking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- TypeScript for both client and server
- ESLint for linting
- Prettier for formatting (add `.prettierrc` if needed)
- Follow existing code patterns

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error

- Ensure MongoDB is running
- Check connection string in `.env`
- Verify MongoDB port (default: 27017)

#### Port Already in Use

- Client: Change port in `vite.config.ts`
- Server: Change PORT in `.env`

#### Dependencies Issues

```bash
# Clean and reinstall
npm run clean
npm run install:all
```

#### TypeScript Errors

```bash
# Check types without building
npx tsc --noEmit

# In client directory
cd client && npx tsc --noEmit

# In server directory
cd server && npx tsc --noEmit
```

### Getting Help

- Check existing issues on GitHub
- Create a new issue with:
  - Environment details (OS, Node version)
  - Steps to reproduce
  - Error messages
  - Expected vs actual behavior

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Fastify Documentation](https://www.fastify.io/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Docker Documentation](https://docs.docker.com/)
