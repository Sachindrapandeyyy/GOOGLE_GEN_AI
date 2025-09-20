#!/bin/bash

# Sukoon AI - Kill processes on development ports
# This script helps clean up any processes that might be using the development ports

echo "🧹 Cleaning up development ports..."

# Function to kill process on a specific port
kill_port() {
    local port=$1
    local name=$2

    # Find process using the port
    local pid=$(lsof -ti:$port 2>/dev/null)

    if [ ! -z "$pid" ]; then
        echo "🔪 Killing process on port $port ($name): PID $pid"
        kill -9 $pid 2>/dev/null || true
    else
        echo "✅ Port $port ($name) is free"
    fi
}

# Kill processes on all development ports
kill_port 8081 "Diary Service"
kill_port 8082 "Chat Service"
kill_port 8083 "Mood Service"
kill_port 8084 "Triage Service"
kill_port 8085 "Insights Service"
kill_port 8086 "Notifications Service"
kill_port 8080 "BFF Service"
kill_port 3000 "Frontend"
kill_port 9091 "Firestore Emulator"
kill_port 9092 "Pub/Sub Emulator"

# Wait a moment for processes to die
sleep 2

echo "✅ Port cleanup completed!"
echo ""
echo "💡 You can now start the development environment safely."
