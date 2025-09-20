# Sukoon AI MVP

A mental health support application with AI-powered diary, chat, mood tracking, and insights.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm
- Google Cloud SDK (for emulators)

### Installation

```bash
# Install all dependencies
npm run install:all
```

### Development

#### Quick Setup (Recommended)

```bash
# Clean up any existing processes on development ports
./scripts/kill-ports.bat  # Windows
# or
./scripts/kill-ports.sh   # Linux/Mac

# Start everything (emulators + services + frontend + BFF)
./scripts/full-local-run.sh
```

#### Manual Setup

1. **Start Emulators** (in terminal 1):

   ```bash
   ./scripts/start-emulators.sh
   ```

2. **Start Services** (in terminal 2):

   ```bash
   npm run dev
   ```

3. **Start Frontend** (in terminal 3):

   ```bash
   npm run dev:frontend
   ```

4. **Start BFF** (in terminal 4):
   ```bash
   npm run dev:bff
   ```

### Service URLs

- **Frontend**: http://localhost:3000
- **BFF/GraphQL**: http://localhost:8080/graphql
- **Diary Service**: http://localhost:8081
- **Chat Service**: http://localhost:8082
- **Mood Service**: http://localhost:8083
- **Triage Service**: http://localhost:8084
- **Insights Service**: http://localhost:8085
- **Firestore Emulator**: http://localhost:9091
- **Pub/Sub Emulator**: http://localhost:9092

**Note**: The Notifications service (8086) is not yet implemented.

### Environment Variables

Make sure these are set when running services:

```bash
export FIRESTORE_EMULATOR_HOST=localhost:9091
export PUBSUB_EMULATOR_HOST=localhost:9092
export NODE_ENV=development
```

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite
- **BFF**: GraphQL API gateway
- **Services**: Microservices architecture
  - Diary Service (8081)
  - Chat Service (8082)
  - Mood Service (8083)
  - Triage Service (8084)
  - Insights Service (8085)
  - Notifications Service (8086)

## 📦 Scripts

- `npm run install:all` - Install all dependencies
- `npm run dev` - Start all microservices
- `npm run dev:frontend` - Start frontend only
- `npm run dev:bff` - Start BFF only
- `npm run test` - Run all tests
- `npm run lint` - Run linting

## 🔧 Troubleshooting

### Port Conflicts

If you get "EADDRINUSE" errors:

```bash
# Kill any processes using development ports
./scripts/kill-ports.bat  # Windows
# or
./scripts/kill-ports.sh   # Linux/Mac
```

This will free up ports 8081-8086 (services), 9091-9092 (emulators), 8080 (BFF), and 3000 (frontend).

### Stopping Services

Press `Ctrl+C` in each terminal to stop the respective service.

### Reset Emulators

```bash
# Stop emulators
pkill -f "gcloud emulators"

# Clear emulator data
rm -rf ~/.config/gcloud/emulators/
```
