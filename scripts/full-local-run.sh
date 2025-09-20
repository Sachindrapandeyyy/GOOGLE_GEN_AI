#!/bin/bash

# Sukoon AI MVP - Full Local Development Setup
# This script sets up everything needed for local development

set -e

echo "🚀 Setting up Sukoon AI MVP for local development..."

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install Google Cloud SDK."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Start emulators in background
echo "🔧 Starting Google Cloud emulators..."
./scripts/start-emulators.sh &
EMULATORS_PID=$!

# Wait for emulators to be ready
sleep 10

# Set environment variables
export FIRESTORE_EMULATOR_HOST=localhost:9091
export PUBSUB_EMULATOR_HOST=localhost:9092
export NODE_ENV=development

# Start BFF service
echo "🌐 Starting BFF service..."
cd bff
npm run dev &
BFF_PID=$!

# Wait for BFF to start
sleep 5

# Start microservices
echo "⚙️ Starting microservices..."

cd ../services/diary
npm run dev &
DIARY_PID=$!

cd ../chat
npm run dev &
CHAT_PID=$!

cd ../mood
npm run dev &
MOOD_PID=$!

cd ../triage
npm run dev &
TRIAGE_PID=$!

cd ../insights
npm run dev &
INSIGHTS_PID=$!

# Start frontend
echo "💻 Starting frontend..."
cd ../../frontend
npm run dev &
FRONTEND_PID=$!

# Wait for everything to start
sleep 10

echo ""
echo "🎉 Sukoon AI MVP is now running locally!"
echo ""
echo "📱 Access the application:"
echo "   Frontend:     http://localhost:3000"
echo "   GraphQL API:  http://localhost:8080/graphql"
echo "   BFF API:      http://localhost:8080/api"
echo ""
echo "🔗 Service URLs:"
echo "   Diary:        http://localhost:8081"
echo "   Chat:         http://localhost:8082"
echo "   Mood:         http://localhost:8083"
echo "   Triage:       http://localhost:8084"
echo "   Insights:     http://localhost:8085"
echo ""
echo "🛑 Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $EMULATORS_PID $BFF_PID $DIARY_PID $CHAT_PID $MOOD_PID $TRIAGE_PID $INSIGHTS_PID $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped"
    exit
}

# Set trap for cleanup
trap cleanup INT

# Keep the script running
wait
