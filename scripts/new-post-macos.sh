#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
error() {
  echo -e "${RED}✗ Error: $1${NC}" >&2
  exit 1
}

success() {
  echo -e "${GREEN}✓ $1${NC}"
}

info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

warn() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
command -v node >/dev/null 2>&1 || error "node is required but not installed. Install: https://nodejs.org/"
command -v git >/dev/null 2>&1 || error "git is required but not installed"
command -v gh >/dev/null 2>&1 || error "gh (GitHub CLI) is required but not installed. Install: brew install gh"

# Check gh authentication
if ! gh auth status >/dev/null 2>&1; then
  error "GitHub CLI not authenticated. Run: gh auth login"
fi

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   📝 Blog Post Submission Workflow     ║"
echo "║          (macOS Version)               ║"
echo "╚════════════════════════════════════════╝"
echo ""
warn "DEPRECATED: Use Sanity Studio to add new blog posts. See docs/BLOG-SANITY-MIGRATION.md"
echo ""

# Detect repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || error "Not in a git repository"
success "Repository root: $REPO_ROOT"

# Ensure we're on main and up to date
cd "$REPO_ROOT"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  info "Switching to main branch..."
  git checkout main || error "Failed to checkout main"
fi
info "Pulling latest changes from main..."
git pull origin main || warn "Could not pull from main (continuing anyway)"
success "Ready to create new post"

# Get post title
echo ""
read -p "Enter post title: " POST_TITLE
if [ -z "$POST_TITLE" ]; then
  error "Post title cannot be empty"
fi

# Generate slug
SLUG=$(node "$SCRIPT_DIR/blog-utils.mjs" slugify "$POST_TITLE")
success "Generated slug: $SLUG"

# Choose input mode
echo ""
info "How would you like to provide the content?"
echo "  1) Path to existing .md/.mdx file (supports drag & drop)"
echo "  2) Paste Markdown content interactively"
read -p "Enter choice (1 or 2): " INPUT_MODE

MARKDOWN_CONTENT=""
SOURCE_MODE=""

if [ "$INPUT_MODE" = "1" ]; then
  read -p "Enter path to markdown file (you can drag & drop): " FILE_PATH
  # Remove quotes that macOS might add from drag & drop
  FILE_PATH=$(echo "$FILE_PATH" | sed "s/^['\"]//;s/['\"]$//")
  if [ ! -f "$FILE_PATH" ]; then
    error "File not found: $FILE_PATH"
  fi
  SOURCE_MODE="file"
  MARKDOWN_CONTENT="$FILE_PATH"
  success "File loaded: $FILE_PATH"
elif [ "$INPUT_MODE" = "2" ]; then
  echo ""
  info "Paste your Markdown content below."
  info "When finished, type 'EOF' on a new line and press Enter."
  echo ""
  
  TEMP_CONTENT=""
  while IFS= read -r line; do
    if [ "$line" = "EOF" ]; then
      break
    fi
    TEMP_CONTENT="${TEMP_CONTENT}${line}"$'\n'
  done
  
  SOURCE_MODE="stdin"
  MARKDOWN_CONTENT="$TEMP_CONTENT"
  success "Content received ($(echo "$MARKDOWN_CONTENT" | wc -l) lines)"
else
  error "Invalid choice. Please enter 1 or 2."
fi

# Process the post
echo ""
info "Processing post..."

if [ "$SOURCE_MODE" = "file" ]; then
  RESULT=$(node "$SCRIPT_DIR/blog-utils.mjs" process "$REPO_ROOT" "$POST_TITLE" "$SLUG" "file" "$MARKDOWN_CONTENT" 2>&1)
else
  # For stdin mode, write content to a temp file to avoid command-line parsing issues
  TEMP_FILE=$(mktemp /tmp/blog-post-XXXXXX.md)
  echo "$MARKDOWN_CONTENT" > "$TEMP_FILE"
  
  RESULT=$(node "$SCRIPT_DIR/blog-utils.mjs" process "$REPO_ROOT" "$POST_TITLE" "$SLUG" "file" "$TEMP_FILE" 2>&1)
  EXIT_CODE=$?
  
  # Clean up temp file
  rm -f "$TEMP_FILE"
  
  if [ $EXIT_CODE -ne 0 ]; then
    error "Failed to process post: $RESULT"
  fi
fi

if [ $? -ne 0 ]; then
  error "Failed to process post: $RESULT"
fi

MDX_PATH=$(echo "$RESULT" | grep -o '"mdxPath":"[^"]*"' | cut -d'"' -f4)
IMAGES_DIR=$(echo "$RESULT" | grep -o '"imagesDir":"[^"]*"' | cut -d'"' -f4)
IMPORTS_ADDED=$(echo "$RESULT" | grep -o '"importsAdded":[0-9]*' | cut -d':' -f2)
IMAGES_COPIED=$(echo "$RESULT" | grep -o '"imagesCopied":[0-9]*' | cut -d':' -f2)

success "Created: $MDX_PATH"
success "Images directory: $IMAGES_DIR"

if [ -n "$IMPORTS_ADDED" ] && [ "$IMPORTS_ADDED" -gt 0 ]; then
  info "Added $IMPORTS_ADDED static image imports for Next.js optimization"
fi

if [ -n "$IMAGES_COPIED" ] && [ "$IMAGES_COPIED" -gt 0 ]; then
  info "Copied $IMAGES_COPIED images to post directory"
fi

COVER_IMAGE=$(echo "$RESULT" | grep -o '"cover":"[^"]*"' | cut -d'"' -f4)
if [ -n "$COVER_IMAGE" ] && [ "$COVER_IMAGE" != "" ]; then
  info "Cover image set: $COVER_IMAGE"
fi

# Prompt for images
echo ""
info "📸 Image Management"
echo "Options:"
echo "  1) I'll copy images manually (press Enter when done)"
echo "  2) Copy images from a directory (supports drag & drop)"
echo "  3) Skip (no images)"
read -p "Enter choice (1, 2, or 3): " IMAGE_MODE

if [ "$IMAGE_MODE" = "1" ]; then
  echo ""
  info "Copy your images to: $IMAGES_DIR"
  info "Tip: You can drag files from Finder into the Terminal"
  read -p "Press Enter when you've added all images..."
  success "Continuing..."
elif [ "$IMAGE_MODE" = "2" ]; then
  read -p "Enter path to images directory (drag & drop folder): " IMAGES_SOURCE
  # Remove quotes from drag & drop
  IMAGES_SOURCE=$(echo "$IMAGES_SOURCE" | sed "s/^['\"]//;s/['\"]$//")
  if [ ! -d "$IMAGES_SOURCE" ]; then
    warn "Directory not found: $IMAGES_SOURCE. Skipping..."
  else
    cp "$IMAGES_SOURCE"/* "$IMAGES_DIR/" 2>/dev/null || warn "No images copied (or copy failed)"
    success "Images copied from $IMAGES_SOURCE"
  fi
elif [ "$IMAGE_MODE" = "3" ]; then
  info "Skipping images"
else
  warn "Invalid choice. Skipping images..."
fi

# Cover image selection
echo ""
info "🎨 Cover Image Selection"
echo "The cover image appears in the blog index/listing page."
echo ""
echo "Options:"
echo "  1) Use first image in post directory (auto-detected)"
echo "  2) Specify a custom image path"
echo "  3) Skip (leave cover empty)"
read -p "Enter choice (1, 2, or 3): " COVER_MODE

COVER_IMAGE=""
if [ "$COVER_MODE" = "1" ]; then
  # Find first image
  FIRST_IMAGE=$(find "$IMAGES_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.webp" -o -iname "*.svg" -o -iname "*.avif" \) | head -n 1)
  if [ -n "$FIRST_IMAGE" ]; then
    IMAGE_FILENAME=$(basename "$FIRST_IMAGE")
    # Copy to public directory
    PUBLIC_DIR="$REPO_ROOT/public/blog/$SLUG"
    mkdir -p "$PUBLIC_DIR"
    cp "$FIRST_IMAGE" "$PUBLIC_DIR/"
    COVER_IMAGE="/blog/$SLUG/$IMAGE_FILENAME"
    success "Cover set: $COVER_IMAGE"
  else
    warn "No images found in post directory"
  fi
elif [ "$COVER_MODE" = "2" ]; then
  read -p "Enter path to cover image (drag & drop): " COVER_PATH
  # Remove quotes from drag & drop
  COVER_PATH=$(echo "$COVER_PATH" | sed "s/^['\"]//;s/['\"]$//")
  if [ -f "$COVER_PATH" ]; then
    IMAGE_FILENAME=$(basename "$COVER_PATH")
    # Copy to public directory
    PUBLIC_DIR="$REPO_ROOT/public/blog/$SLUG"
    mkdir -p "$PUBLIC_DIR"
    cp "$COVER_PATH" "$PUBLIC_DIR/"
    COVER_IMAGE="/blog/$SLUG/$IMAGE_FILENAME"
    success "Cover set: $COVER_IMAGE"
  else
    warn "File not found: $COVER_PATH. Skipping cover..."
  fi
elif [ "$COVER_MODE" = "3" ]; then
  info "Skipping cover image"
else
  warn "Invalid choice. Skipping cover image..."
fi

# Update MDX file with cover image if set
if [ -n "$COVER_IMAGE" ]; then
  # Update the cover field in frontmatter
  if [ "$(uname)" = "Darwin" ]; then
    # macOS sed syntax
    sed -i '' "s|^cover: ''$|cover: $COVER_IMAGE|" "$MDX_PATH"
  else
    # Linux sed syntax
    sed -i "s|^cover: ''$|cover: $COVER_IMAGE|" "$MDX_PATH"
  fi
  info "Updated frontmatter with cover image"
fi

# Excerpt selection
echo ""
info "📝 Excerpt Selection"
echo "The excerpt appears in the blog index and SEO metadata."
echo ""

# Get current auto-generated excerpt
CURRENT_EXCERPT=$(node "$SCRIPT_DIR/blog-utils.mjs" get-excerpt "$MDX_PATH")
echo "Current excerpt (auto-generated from first paragraph):"
echo "\"$CURRENT_EXCERPT\""
echo ""

echo "Options:"
echo "  1) Keep auto-generated excerpt"
echo "  2) Write custom excerpt"
read -p "Enter choice (1 or 2): " EXCERPT_MODE

if [ "$EXCERPT_MODE" = "2" ]; then
  echo ""
  info "Enter your custom excerpt (press Enter when done):"
  read -p "> " CUSTOM_EXCERPT
  
  if [ -n "$CUSTOM_EXCERPT" ]; then
    node "$SCRIPT_DIR/blog-utils.mjs" update-excerpt "$MDX_PATH" "$CUSTOM_EXCERPT" >/dev/null
    success "Custom excerpt set"
  else
    info "Keeping auto-generated excerpt"
  fi
elif [ "$EXCERPT_MODE" = "1" ]; then
  info "Keeping auto-generated excerpt"
else
  warn "Invalid choice. Keeping auto-generated excerpt..."
fi

# Git operations
echo ""
info "🔀 Git Operations"

# Add timestamp to branch name to allow multiple posts with same slug
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH_NAME="chore/blog/$SLUG-$TIMESTAMP"

# Ensure we're on a clean state
cd "$REPO_ROOT"
git fetch origin >/dev/null 2>&1 || warn "Could not fetch from origin"

# Create and checkout branch
if git rev-parse --verify "$BRANCH_NAME" >/dev/null 2>&1; then
  warn "Branch $BRANCH_NAME already exists locally. Checking it out..."
  git checkout "$BRANCH_NAME" || error "Failed to checkout branch"
else
  git checkout -b "$BRANCH_NAME" || error "Failed to create branch"
  success "Created branch: $BRANCH_NAME"
fi

# Add files
git add "$MDX_PATH" "$IMAGES_DIR" || error "Failed to add files"

# Add public directory if cover image was set
if [ -n "$COVER_IMAGE" ]; then
  PUBLIC_DIR="$REPO_ROOT/public/blog/$SLUG"
  if [ -d "$PUBLIC_DIR" ]; then
    git add "$PUBLIC_DIR" || warn "Could not add public directory"
  fi
fi

success "Files staged"

# Commit
COMMIT_MSG="feat(blog): add $SLUG"
git commit -m "$COMMIT_MSG" || error "Failed to commit"
success "Committed: $COMMIT_MSG"

# Push
git push -u origin "$BRANCH_NAME" || error "Failed to push branch"
success "Pushed to origin/$BRANCH_NAME"

# Success message
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Success! Your blog post is ready.${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo "📝 Post: $POST_TITLE"
echo "🌿 Branch: $BRANCH_NAME"
echo "📂 File: $MDX_PATH"
echo ""
info "Create a PR manually when ready: gh pr create --base main"

# Return to main branch
echo ""
info "Returning to main branch..."
git checkout main || warn "Could not checkout main"
git pull origin main || warn "Could not pull from main"
success "Returned to main branch"

