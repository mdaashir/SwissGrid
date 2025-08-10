#!/bin/bash

# Development startup script for SwissGrid monorepo

echo "🚀 Starting SwissGrid Development Environment"
echo "============================================="

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   - macOS/Linux: brew services start mongodb-community"
    echo "   - Windows: net start MongoDB"
    echo "   - Docker: docker run -d -p 27017:27017 mongo:7.0"
    echo ""
fi

# Function to run client
start_client() {
    echo "📱 Starting React client..."
    cd client && npm run dev
}

# Function to run server
start_server() {
    echo "🖥️  Starting Fastify server..."
    cd server && npm run dev
}

# Check if we want to start both or individual services
case "$1" in
    "client")
        start_client
        ;;
    "server")
        start_server
        ;;
    "")
        echo "Choose what to start:"
        echo "  npm run dev:client  - Start React client only"
        echo "  npm run dev:server  - Start Fastify server only"
        echo "  docker-compose up   - Start everything with Docker"
        echo ""
        echo "Starting both services..."
        # Start server in background
        start_server &
        # Start client in foreground
        start_client
        ;;
    *)
        echo "Usage: $0 [client|server]"
        exit 1
        ;;
esac
