#!/bin/bash

# AutoGD&T Engine - Correct Start Script
# For project structure with BACKEND and FRONTEND folders

echo "🚀 AutoGD&T Engine - Quick Start"
echo "================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get the script directory (GD-T folder)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
BACKEND_DIR="$SCRIPT_DIR/BACKEND"
FRONTEND_DIR="$SCRIPT_DIR/FRONTEND/autogdt-engine"

echo -e "${BLUE}Project root: $SCRIPT_DIR${NC}"

# Check if directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ BACKEND directory not found at: $BACKEND_DIR${NC}"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ FRONTEND directory not found at: $FRONTEND_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found BACKEND and FRONTEND directories${NC}"

# Check if main.py exists
if [ ! -f "$BACKEND_DIR/main.py" ]; then
    echo -e "${RED}❌ main.py not found in BACKEND directory${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found main.py${NC}"

# Backend Setup
echo ""
echo -e "${BLUE}📦 Setting up Backend...${NC}"
cd "$BACKEND_DIR"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt > /dev/null 2>&1
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Create necessary directories
mkdir -p uploads outputs
echo -e "${GREEN}✓ Created uploads and outputs directories${NC}"

# Frontend Setup
echo ""
echo -e "${BLUE}📦 Setting up Frontend...${NC}"
cd "$FRONTEND_DIR"

# Install npm dependencies if needed
if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "VITE_API_URL=http://localhost:8000" > .env
    echo -e "${GREEN}✓ Created .env file${NC}"
fi

# Check if api.js exists
if [ ! -f "src/services/api.js" ]; then
    echo -e "${YELLOW}⚠️  WARNING: src/services/api.js not found${NC}"
    echo -e "${YELLOW}   Please make sure to create this file before the frontend will work${NC}"
fi

# Start servers
echo ""
echo -e "${BLUE}🚀 Starting servers...${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${BLUE}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    deactivate 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
cd "$BACKEND_DIR"
source venv/bin/activate
python3 main.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 2

# Check if backend started successfully
if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    echo -e "${YELLOW}Check logs:${NC}"
    cat /tmp/backend.log
    exit 1
fi

echo -e "${GREEN}✓ Backend started on http://localhost:8000${NC}"

# Start frontend
cd "$FRONTEND_DIR"
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 2

# Check if frontend started successfully
if ! ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${RED}❌ Frontend failed to start${NC}"
    echo -e "${YELLOW}Check logs:${NC}"
    cat /tmp/frontend.log
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✓ Frontend started on http://localhost:5173${NC}"

echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}✅ AutoGD&T Engine is running!${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo "  Backend:  tail -f /tmp/backend.log"
echo "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo -e "${RED}Press Ctrl+C to stop both servers${NC}"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID