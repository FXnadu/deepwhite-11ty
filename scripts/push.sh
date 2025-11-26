#!/bin/bash
set -euo pipefail

REPO_DIR="/Users/warmwhite/Documents/deepwhite-11ty"
DEFAULT_MESSAGE="chore: sync blog updates"
BRANCH_NAME="main"

cd "$REPO_DIR"

echo "Running Eleventy build..."
npm run build

echo "Staging changes..."
git add -A

COMMIT_MESSAGE="${1:-$DEFAULT_MESSAGE}"

if git diff --cached --quiet; then
  echo "No changes detected after build; nothing to push."
  exit 0
fi

echo "Committing with message: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE"

echo "Pushing to origin/$BRANCH_NAME..."
git push origin "$BRANCH_NAME"

echo "Done."


