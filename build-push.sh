#!/bin/bash
set -e

DOCKER_USER="maikusobu"
BACKEND_IMAGE="$DOCKER_USER/html-viewer-backend:latest"
FRONTEND_IMAGE="$DOCKER_USER/html-viewer-frontend:latest"

echo "============================================"
echo "  Build & Push to Docker Hub"
echo "  User: $DOCKER_USER"
echo "============================================"
echo ""

# Check docker login
docker info 2>/dev/null | grep -q "Username" || {
  echo "Please log in to Docker Hub first:"
  docker login
}

echo "[1/4] Building backend image..."
docker build -t "$BACKEND_IMAGE" ./backend
echo "      Done."

echo "[2/4] Building frontend image..."
docker build -t "$FRONTEND_IMAGE" ./frontend
echo "      Done."

echo "[3/4] Pushing backend image..."
docker push "$BACKEND_IMAGE"
echo "      Done."

echo "[4/4] Pushing frontend image..."
docker push "$FRONTEND_IMAGE"
echo "      Done."

echo ""
echo "============================================"
echo "  Images pushed successfully!"
echo ""
echo "  $BACKEND_IMAGE"
echo "  $FRONTEND_IMAGE"
echo "============================================"
echo ""
echo "Next: Deploy to K8s with:"
echo "  kubectl apply -f k8s/"
echo ""
echo "Or use the deploy script:"
echo "  chmod +x deploy-k8s.sh && ./deploy-k8s.sh"
