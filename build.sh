#!/bin/bash
set -e

echo "=== Installing frontend dependencies ==="
cd frontend
NODE_ENV=development npm install --legacy-peer-deps

echo "=== Building frontend ==="
npm run build

echo "=== Installing backend dependencies ==="
cd ../backend
pip install -r requirements.txt

echo "=== Build complete ==="
