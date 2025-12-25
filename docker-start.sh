#!/bin/bash

echo "🐳 AutoGD&T Engine - Docker Setup"
echo "=================================="

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed and running${NC}"
echo ""

echo -e "${BLUE}🏗️  Building Docker images...${NC}"
docker-compose build

echo -e "${BLUE}🚀 Starting containers...${NC}"
docker-compose up -d

sleep 5

echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}✅ AutoGD&T Engine is running!${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}Commands:${NC}"
echo "  Logs:    docker-compose logs -f"
echo "  Stop:    docker-compose down"
echo "  Restart: docker-compose restart"
