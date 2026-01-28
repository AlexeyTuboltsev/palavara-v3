#!/bin/bash

#
# Deploy Optimized Images to S3/CloudFront CDN
#
# This script syncs optimized images to the S3 bucket for the CDN
# and sets appropriate cache headers.
#

set -e

echo "🚀 Deploying optimized images to CDN..."

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed"
    echo "   Install it with: pip install awscli"
    exit 1
fi

# Configuration
S3_BUCKET="data.palavara.com"
S3_PATH="img/studio"
OPTIMIZED_DIR="public/img/optimized"
MANIFEST_FILE="public/img/image-manifest.json"
AWS_REGION="eu-central-1"

# Check if optimized images exist
if [ ! -d "$OPTIMIZED_DIR" ]; then
    echo "❌ Error: Optimized images directory not found: $OPTIMIZED_DIR"
    echo "   Run 'yarn optimize-images' first to generate optimized images"
    exit 1
fi

# Check if manifest exists
if [ ! -f "$MANIFEST_FILE" ]; then
    echo "❌ Error: Image manifest not found: $MANIFEST_FILE"
    echo "   Run 'yarn optimize-images' first to generate the manifest"
    exit 1
fi

echo ""
echo "📦 Syncing optimized images to s3://$S3_BUCKET/$S3_PATH/optimized/"
echo "   Cache headers: max-age=31536000, immutable"
echo ""

# Sync optimized images with immutable cache headers
# These images have content-based names, so they can be cached forever
aws s3 sync "$OPTIMIZED_DIR/" "s3://$S3_BUCKET/$S3_PATH/optimized/" \
  --region "$AWS_REGION" \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.DS_Store" \
  --exclude ".*" \
  --size-only \
  --delete

echo ""
echo "📋 Uploading manifest to s3://$S3_BUCKET/$S3_PATH/image-manifest.json"
echo "   Cache headers: max-age=3600"
echo ""

# Upload manifest with short cache (1 hour)
# Manifest can change frequently, so we use a shorter cache
aws s3 cp "$MANIFEST_FILE" "s3://$S3_BUCKET/$S3_PATH/image-manifest.json" \
  --region "$AWS_REGION" \
  --cache-control "public, max-age=3600" \
  --content-type "application/json"

echo ""
echo "✅ Images deployed successfully to CDN!"
echo ""
echo "📊 Deployment summary:"
echo "   S3 Bucket: s3://$S3_BUCKET"
echo "   CDN Path: https://$S3_BUCKET/$S3_PATH/optimized/"
echo "   Manifest: https://$S3_BUCKET/$S3_PATH/image-manifest.json"
echo ""
