#!/bin/bash
# Stop and clean up Docker container/image for monorepo-day2
docker stop monorepo-day2-container 2>/dev/null || true
docker rm monorepo-day2-container 2>/dev/null || true
docker rmi monorepo-day2-app 2>/dev/null || true
echo "Cleanup complete."
