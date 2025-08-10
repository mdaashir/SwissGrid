# Development startup script for SwissGrid monorepo (PowerShell)

Write-Host "🚀 Starting SwissGrid Development Environment" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if MongoDB is running
$mongoProcess = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
if (-not $mongoProcess) {
    Write-Host "⚠️  MongoDB is not running. Please start MongoDB first:" -ForegroundColor Yellow
    Write-Host "   - Windows: net start MongoDB" -ForegroundColor Yellow
    Write-Host "   - Docker: docker run -d -p 27017:27017 mongo:7.0" -ForegroundColor Yellow
    Write-Host ""
}

# Function to start client
function Start-Client {
    Write-Host "📱 Starting React client..." -ForegroundColor Blue
    Set-Location client
    npm run dev
    Set-Location ..
}

# Function to start server
function Start-Server {
    Write-Host "🖥️  Starting Fastify server..." -ForegroundColor Blue
    Set-Location server
    npm run dev
    Set-Location ..
}

# Check command line argument
switch ($args[0]) {
    "client" {
        Start-Client
        break
    }
    "server" {
        Start-Server
        break
    }
    default {
        Write-Host "Choose what to start:" -ForegroundColor Cyan
        Write-Host "  npm run dev:client  - Start React client only" -ForegroundColor Cyan
        Write-Host "  npm run dev:server  - Start Fastify server only" -ForegroundColor Cyan
        Write-Host "  docker-compose up   - Start everything with Docker" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Starting both services..." -ForegroundColor Green

        # Start server in background job
        Start-Job -ScriptBlock {
            Set-Location $using:PWD
            Start-Server
        }

        # Start client in foreground
        Start-Client
        break
    }
}
