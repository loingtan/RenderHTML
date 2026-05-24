#!/bin/bash
set -e

echo "============================================"
echo "  HTML/MHTML Viewer - Local Setup"
echo "============================================"
echo ""

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required. Install: https://docs.docker.com/get-docker/"; exit 1; }
command -v docker compose >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required."; exit 1; }

echo "Starting services..."
echo ""

# Use docker compose (v2) or docker-compose (v1)
if docker compose version >/dev/null 2>&1; then
  docker compose up --build -d
else
  docker-compose up --build -d
fi

echo ""
echo "============================================"
echo "  App is running!"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8001"
echo "  MongoDB:   mongodb://localhost:27017"
echo "============================================"
echo ""
echo "To stop: docker compose down"
echo "To stop and clear data: docker compose down -v"
