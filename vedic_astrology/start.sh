#!/bin/bash

# Vedic Astrology App Startup Script
# Kills existing processes, starts backend & frontend, runs API test

set -e

BACKEND_PORT=8000
FRONTEND_PORT=5173
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🔮 Vedic Astrology App Startup"
echo "=============================="

# Kill anything on the ports
echo "🧹 Cleaning up existing processes..."
fuser -k $BACKEND_PORT/tcp 2>/dev/null && echo "   Killed process on port $BACKEND_PORT" || echo "   Port $BACKEND_PORT clear"
fuser -k $FRONTEND_PORT/tcp 2>/dev/null && echo "   Killed process on port $FRONTEND_PORT" || echo "   Port $FRONTEND_PORT clear"

sleep 1

# Start backend
echo ""
echo "🐍 Starting backend..."
cd "$PROJECT_DIR/backend"
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT &
BACKEND_PID=$!

# Wait for backend to be ready
echo "   Waiting for backend..."
for i in {1..30}; do
    if curl -s http://localhost:$BACKEND_PORT/ > /dev/null 2>&1; then
        echo "   ✅ Backend ready (PID: $BACKEND_PID)"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ❌ Backend failed to start"
        exit 1
    fi
    sleep 0.5
done

# Start frontend
echo ""
echo "⚛️  Starting frontend..."
cd "$PROJECT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "   Waiting for frontend..."
for i in {1..30}; do
    if curl -s http://localhost:$FRONTEND_PORT/ > /dev/null 2>&1; then
        echo "   ✅ Frontend ready (PID: $FRONTEND_PID)"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "   ❌ Frontend failed to start"
        exit 1
    fi
    sleep 0.5
done

# Quick API test
echo ""
echo "🧪 Running API test..."
TEST_DATA='{"year":1990,"month":6,"day":15,"hour":10,"minute":30,"latitude":28.6139,"longitude":77.209}'

# Test health endpoint
HEALTH=$(curl -s http://localhost:$BACKEND_PORT/)
if echo "$HEALTH" | grep -q "ok"; then
    echo "   ✅ Health check passed"
else
    echo "   ❌ Health check failed"
fi

# Test chart calculation
CHART=$(curl -s -X POST http://localhost:$BACKEND_PORT/api/chart \
    -H "Content-Type: application/json" \
    -d "$TEST_DATA")

if echo "$CHART" | grep -q "ascendant"; then
    echo "   ✅ Chart calculation passed"
    # Extract some data for display
    ASC_SIGN=$(echo "$CHART" | grep -o '"sign":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "      Sample: Ascendant in $ASC_SIGN"
else
    echo "   ❌ Chart calculation failed"
fi

# Test dasha calculation
DASHA=$(curl -s -X POST http://localhost:$BACKEND_PORT/api/dasha \
    -H "Content-Type: application/json" \
    -d "$TEST_DATA")

if echo "$DASHA" | grep -q "maha_dashas"; then
    echo "   ✅ Dasha calculation passed"
else
    echo "   ❌ Dasha calculation failed"
fi

echo ""
echo "=============================="
echo "👍 All systems go!"
echo ""
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo "   Backend:  http://localhost:$BACKEND_PORT"
echo "   API Docs: http://localhost:$BACKEND_PORT/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait
