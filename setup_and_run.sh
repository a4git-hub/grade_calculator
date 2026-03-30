#!/bin/bash

# Function to clean up background processes on exit
cleanup() {
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Trap the SIGINT signal (Ctrl+C)
trap cleanup SIGINT

echo "Cleaning up any old server processes..."
lsof -ti:8001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
lsof -ti:5174 | xargs kill -9 2>/dev/null

echo "Starting Backend API (Port 8001)..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8001 &
BACKEND_PID=$!
cd ..

echo "Starting Frontend App..."
cd frontend
npm run dev -- --port 5173 &
FRONTEND_PID=$!
cd ..

echo ""
echo "================================================="
echo "🚀 Infinite Campus Grade Calculator is LIVE! 🚀"
echo "================================================="
echo "Backend API Proxy is running silently in the background."
echo "Frontend App connects automatically."
echo ""
echo "👉 CLICK HERE TO OPEN: http://localhost:5173 👈"
echo ""
echo "Press Ctrl+C inside this terminal to stop both servers."
echo "================================================="
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
