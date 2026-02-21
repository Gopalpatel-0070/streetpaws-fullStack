#!/bin/bash
# StreetPaws Vercel Deployment Script
# This script helps you deploy to Vercel step by step

set -e

echo "🚀 StreetPaws Vercel Deployment Helper"
echo "======================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Prerequisites check complete"
echo ""

# Step 1: Verify everything is committed
echo "Step 1: Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Committing..."
    git add .
    git commit -m "Vercel deployment configuration"
fi
echo "✅ Git status OK"
echo ""

# Step 2: Deploy Backend
echo "Step 2: Deploying Backend..."
echo "Choose one:"
echo "  A) Deploy to production (--prod)"
echo "  B) Deploy to preview/staging"
echo ""
read -p "Enter choice (A/B): " BACKEND_CHOICE

cd server

if [ "$BACKEND_CHOICE" = "A" ] || [ "$BACKEND_CHOICE" = "a" ]; then
    echo "🚀 Deploying backend to production..."
    vercel --prod
else
    echo "🚀 Deploying backend to preview..."
    vercel
fi

echo "✅ Backend deployment complete!"
echo ""

# Step 3: Deploy Frontend
cd ../client

echo "Step 3: Deploying Frontend..."
read -p "Enter choice (A/B): " FRONTEND_CHOICE

if [ "$FRONTEND_CHOICE" = "A" ] || [ "$FRONTEND_CHOICE" = "a" ]; then
    echo "🚀 Deploying frontend to production..."
    vercel --prod
else
    echo "🚀 Deploying frontend to preview..."
    vercel
fi

echo "✅ Frontend deployment complete!"
echo ""

echo "🎉 Deployment Complete!"
echo "======================================="
echo "Next steps:"
echo "1. Visit https://dashboard.vercel.com to verify deployments"
echo "2. Add environment variables if not already set"
echo "3. Check your application at the deployed URL"
echo "4. Run: vercel logs <project-name> to view live logs"
