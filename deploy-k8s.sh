#!/bin/bash
set -e

echo "============================================"
echo "  Deploy HTML Viewer to Kubernetes"
echo "============================================"
echo ""

# Check kubectl
command -v kubectl >/dev/null 2>&1 || { echo "Error: kubectl is required."; exit 1; }

echo "[1/5] Creating namespace..."
kubectl apply -f k8s/namespace.yaml

echo "[2/5] Deploying MongoDB..."
kubectl apply -f k8s/mongodb.yaml

echo "[3/5] Waiting for MongoDB to be ready..."
kubectl -n html-viewer rollout status deployment/mongodb --timeout=120s

echo "[4/5] Deploying Backend..."
kubectl apply -f k8s/backend.yaml

echo "[5/5] Deploying Frontend..."
kubectl apply -f k8s/frontend.yaml

echo ""
echo "Waiting for rollouts..."
kubectl -n html-viewer rollout status deployment/backend --timeout=120s
kubectl -n html-viewer rollout status deployment/frontend --timeout=120s

echo ""
echo "============================================"
echo "  Deployment complete!"
echo ""

# Get node IP
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "<NODE_IP>")

echo "  App URL:  http://$NODE_IP:30080"
echo ""
echo "  Pods:"
kubectl -n html-viewer get pods
echo ""
echo "  Services:"
kubectl -n html-viewer get svc
echo ""
echo "============================================"
echo ""
echo "Commands:"
echo "  Check status:     kubectl -n html-viewer get all"
echo "  View backend logs: kubectl -n html-viewer logs -l app=backend -f"
echo "  View frontend logs: kubectl -n html-viewer logs -l app=frontend -f"
echo "  Scale backend:    kubectl -n html-viewer scale deploy/backend --replicas=3"
echo "  Delete all:       kubectl delete namespace html-viewer"
