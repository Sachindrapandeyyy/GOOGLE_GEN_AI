#!/bin/bash

# Sukoon AI - Local Development Emulators Setup
# This script starts all required Google Cloud emulators for local development

set -e

echo "🚀 Starting Sukoon AI Local Emulators..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install Google Cloud SDK first."
    echo "   Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project (use a placeholder if not set)
PROJECT_ID=${GCP_PROJECT_ID:-sukoon-dev}
echo "📍 Using project: $PROJECT_ID"

# Start Firestore Emulator
echo "🔥 Starting Firestore Emulator..."
gcloud emulators firestore start --host-port=localhost:9091 --project=$PROJECT_ID &
FIRESTORE_PID=$!

# Wait a moment for Firestore to start
sleep 3

# Start Pub/Sub Emulator
echo "📨 Starting Pub/Sub Emulator..."
gcloud emulators pubsub start --host-port=localhost:9092 --project=$PROJECT_ID &
PUBSUB_PID=$!

# Wait for emulators to be ready
echo "⏳ Waiting for emulators to be ready..."
sleep 5

# Set environment variables for emulators
export FIRESTORE_EMULATOR_HOST=localhost:9091
export PUBSUB_EMULATOR_HOST=localhost:9092

echo "✅ Emulators started successfully!"
echo ""
echo "📋 Environment Variables Set:"
echo "   FIRESTORE_EMULATOR_HOST=$FIRESTORE_EMULATOR_HOST"
echo "   PUBSUB_EMULATOR_HOST=$PUBSUB_EMULATOR_HOST"
echo ""
echo "🔗 Emulator URLs:"
echo "   Firestore: http://localhost:9091"
echo "   Pub/Sub: http://localhost:9092"
echo ""
echo "💡 Keep this terminal open. Emulators are running in the background."
echo "   Press Ctrl+C to stop all emulators."

# Wait for user to stop
trap "echo '🛑 Stopping emulators...'; kill $FIRESTORE_PID $PUBSUB_PID 2>/dev/null; exit" INT

# Keep the script running
wait
