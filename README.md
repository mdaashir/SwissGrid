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

2. Install dependencies for both client and server:

   ```bash
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
# Terminal 1 - Start the server
cd server
npm run dev

# Terminal 2 - Start the client
cd client
npm run dev
```

### Testing

Run tests for both applications:

```bash
# Test client
cd client
npm test

# Test server
cd server
npm test
```

## 📦 Docker

Build and run with Docker:

```bash
# Build and start all services
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

This project is licensed under the terms specified in the LICENSE file.
