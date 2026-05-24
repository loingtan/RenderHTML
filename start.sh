#!/bin/bash
set -e

echo "============================================"
echo "  HTML/MHTML Viewer - Local Setup"
echo "============================================"
echo ""

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Error: Docker is required. Install: https://docs.docker.com/get-docker/"; exit 1; }

# Detect compose command
COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "Error: Docker Compose is required."
  echo "Install: https://docs.docker.com/compose/install/"
  exit 1
fi

echo "Using: $COMPOSE_CMD"
echo "Building and starting services (first run may take 2-3 min)..."
echo ""

$COMPOSE_CMD up --build -d

echo ""
echo "Waiting for services to start..."
sleep 3

# Check if services are running
if $COMPOSE_CMD ps | grep -q "html-viewer-frontend"; then
  echo ""
  echo "============================================"
  echo "  App is running!"
  echo ""
  echo "  Frontend:  http://localhost:3000"
  echo "  Backend:   http://localhost:8001/api/"
  echo "  MongoDB:   mongodb://localhost:27017"
  echo "============================================"
  echo ""
  echo "Commands:"
  echo "  Stop:              $COMPOSE_CMD down"
  echo "  Stop + wipe data:  $COMPOSE_CMD down -v"
  echo "  View logs:         $COMPOSE_CMD logs -f"
  echo ""
else
  echo ""
  echo "Something went wrong. Check logs:"
  echo "  $COMPOSE_CMD logs"
fi
