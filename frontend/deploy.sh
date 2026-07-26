#!/bin/bash
set -euo pipefail

BUCKET_NAME="${1:-mtto-frontend}"
DISTRIBUTION_ID="${2:-}"
REGION="${3:-us-east-1}"
SOURCE_DIR="dist"

echo "==> Building frontend..."
npm run build

echo "==> Syncing to S3 bucket: ${BUCKET_NAME}"
aws s3 sync "${SOURCE_DIR}/" "s3://${BUCKET_NAME}/" --delete --region "${REGION}"

if [ -n "${DISTRIBUTION_ID}" ]; then
  echo "==> Invalidating CloudFront: ${DISTRIBUTION_ID}"
  aws cloudfront create-invalidation \
    --distribution-id "${DISTRIBUTION_ID}" \
    --paths "/*" \
    --region "${REGION}"
  echo "==> Invalidation sent."
fi

echo "==> Deploy complete!"
