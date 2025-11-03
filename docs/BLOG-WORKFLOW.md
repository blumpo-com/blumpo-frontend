# Blog Post Workflow - Complete Guide

**Version:** 4.2 (Production Ready)  
**Last Updated:** November 3, 2025  
**Status:** ✅ Enhanced with markdown image conversion, interactive cover selection & improved git workflow

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Prerequisites](#prerequisites)
4. [How to Use](#how-to-use)
5. [Features](#features)
6. [What Gets Created](#what-gets-created)
7. [Fixes & Improvements](#fixes--improvements)
8. [Technical Details](#technical-details)
9. [Troubleshooting](#troubleshooting)

---

## Overview

A cross-platform automated workflow for creating and submitting blog posts to your Next.js App Router project.

### What It Does

✅ **Creates blog posts** with validated frontmatter  
✅ **Converts markdown images** to Next.js `<Image>` components with static imports  
✅ **Interactive cover selection** - choose first image, custom image, or skip  
✅ **Preserves metadata** from pasted content (tags, dates, excerpts)  
✅ **Creates git branch** and commits changes  
✅ **Opens GitHub PR** with checklist  
✅ **Works everywhere** - Linux, macOS, Windows  

---

## Quick Start

### Run the Workflow

**Windows:**
```powershell
.\scripts\new-post-windows.ps1
```

**Linux/macOS:**
```bash
./scripts/new-post-linux.sh   # or new-post-macos.sh
```

### Follow the Prompts

1. **Enter title:** "My Awesome Post"
2. **Choose input:** File path or paste content
3. **Manage images:** Drop images into the created folder
4. **Review & submit:** Creates branch, commits, opens PR

**Done!** 🎉 Your post is ready for review.

---

## Prerequisites

Before using the workflow, ensure you have:

### Required Tools

| Tool | Minimum Version | Check Command |
|------|----------------|---------------|
| **Node.js** | 18+ | `node --version` |
| **Git** | Any | `git --version` |
| **GitHub CLI** | Latest | `gh --version` |

### Install GitHub CLI

**Linux (Debian/Ubuntu):**
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

**macOS:**
```bash
brew install gh
```

**Windows:**
```powershell
winget install --id GitHub.cli
```

### Authenticate GitHub CLI

```bash
gh auth login
```

Follow the prompts to authenticate with your GitHub account.

---

## How to Use

### Step 1: Run the Script

Choose your platform:

```bash
# Windows
.\scripts\new-post-windows.ps1

# Linux
./scripts/new-post-linux.sh

# macOS
./scripts/new-post-macos.sh
```

**The script will automatically:**
- Switch to `main` branch if you're on a different branch
- Pull the latest changes from `origin/main`
- Ensure you're starting with a clean, up-to-date state

### Step 2: Enter Post Title

```
Enter post title: Getting Started with Next.js 15
✓ Generated slug: getting-started-with-nextjs-15
```

The slug is auto-generated (lowercase, hyphenated).

### Step 3: Provide Content

**Option 1: File Path**

```
How would you like to provide the content?
  1) Path to existing .md/.mdx file
  2) Paste Markdown content interactively
Enter choice (1 or 2): 1

Enter path to markdown file: ~/Documents/my-post.md
✓ File loaded: /home/user/Documents/my-post.md
```

**Option 2: Paste Content**

```
Enter choice (1 or 2): 2

Paste your Markdown content below.
Press Ctrl+D (Linux/Mac) or Ctrl+Z (Windows) when done:
---
title: "My Post"
tags: ["nextjs", "react"]
---

# My Post

Content here...
^D
✓ Content received (245 characters)
```

### Step 4: Processing

The workflow automatically:

```
✓ Created: content/blog/getting-started-with-nextjs-15.mdx
✓ Images directory: content/blog/getting-started-with-nextjs-15/
✓ Added 3 static image imports for Next.js optimization
✓ Copied 2 images to post directory
✓ Cover image set: /blog/getting-started-with-nextjs-15/hero.png
```

### Step 5: Manage Images

```
📸 Image Management

Options:
  1) I'll copy images manually (press Enter when done)
  2) Copy images from a directory (supports drag & drop)
  3) Skip (no images)
Enter choice (1, 2, or 3):
```

**What to do:**
- Copy your images to the displayed directory
- Images will be automatically converted to Next.js `<Image>` components with static imports

### Step 6: Select Cover Image

```
🎨 Cover Image Selection
The cover image appears in the blog index/listing page.

Options:
  1) Use first image in post directory (auto-detected)
  2) Specify a custom image path
  3) Skip (leave cover empty)
Enter choice (1, 2, or 3):
```

**What to do:**
- **Option 1:** Automatically uses the first image found in the post directory
- **Option 2:** Drag and drop a custom image file (can be from anywhere)
- **Option 3:** Skip if you don't want a cover image

**Note:** The cover image is automatically copied to `public/blog/<slug>/` with an absolute path like `/blog/<slug>/image.png`

### Step 7: Git & PR Creation

```
✓ Branch created: chore/blog/getting-started-with-nextjs-15
✓ Changes committed
✓ Pushed to remote
✓ PR opened: https://github.com/user/repo/pull/123
✓ Returned to main branch
✓ Pulled latest changes
```

**Done!** Your post is ready for review, and you're back on the main branch with the latest changes.

---

## Features

### 🎯 Frontmatter Management

**Behavior:**

| Field | Source | Notes |
|-------|--------|-------|
| `title` | Input → Prompt | Prefers pasted frontmatter |
| `slug` | Generated | Always from workflow |
| `date` | Input → Today | ISO format |
| `tags` | Input → `[]` | Preserved from paste |
| `excerpt` | Input → Generated | From content or input |
| `cover` | Auto-detected | First image → `/public` |
| `draft` | Input → `false` | Workflow default |

**Example:**

```yaml
---
title: Getting Started with Next.js 15
slug: getting-started-with-nextjs-15
date: '2025-11-03'
tags:
  - nextjs
  - react
excerpt: >-
  Learn how to build modern web applications with Next.js 15...
cover: /blog/getting-started-with-nextjs-15/hero.png
draft: false
---
```

### 🖼️ Image Processing

**What It Does:**

1. ✅ **Detects images** in content (`<Image>`, `![](...)`, `<img>`)
2. ✅ **Converts ALL markdown images to Next.js `<Image>` components** with static imports
3. ✅ **Fixes paths** to include slug directory
4. ✅ **Copies images** to post folder if needed
5. ✅ **Interactive cover selection** for blog index thumbnails

**Before (Markdown Input):**
```markdown
![Hero image](./hero.png)
```

**After (Next.js Output):**
```jsx
import Image from 'next/image'
import hero from './getting-started-with-nextjs-15/hero.png'

<Image src={hero} alt="Hero image" />
```

**Before (JSX Input):**
```jsx
<Image src="./hero.png" alt="Hero" width={800} height={400} />
```

**After (Output):**
```jsx
import Image from 'next/image'
import hero from './getting-started-with-nextjs-15/hero.png'

<Image src={hero} alt="Hero" width={800} height={400} />
```

**Why?**
- ✅ **Build-time validation** - Errors if image missing
- ✅ **Type safety** - TypeScript validates imports
- ✅ **Optimization** - Next.js optimizes images automatically
- ✅ **Correct paths** - Always includes slug directory
- ✅ **Works with both** - Markdown and JSX images are both converted

### 📁 File Structure

**What gets created:**

```
content/blog/
  ├── my-post.mdx                   # Your blog post
  └── my-post/                      # Images directory
      ├── hero.png                  # Content images
      ├── screenshot-1.png
      └── diagram.svg

public/blog/
  └── my-post/
      └── hero.png                  # Cover for blog index
```

### 🔀 Git Workflow

**Automatic:**

1. ✅ Checks out `main` branch (if not already on it)
2. ✅ Pulls latest changes from `origin/main`
3. ✅ Creates branch: `chore/blog/<slug>`
4. ✅ Commits with message: `blog: add <title>`
5. ✅ Pushes to remote
6. ✅ Opens PR with checklist
7. ✅ Returns to `main` branch
8. ✅ Pulls latest changes again

```markdown
🎉 New article ready for review!

**Title:** Getting Started with Next.js 15
**Date:** 2025-11-03
**Slug:** `getting-started-with-nextjs-15`
**Preview:** `/blog/getting-started-with-nextjs-15`

**Excerpt:**
> Learn how to build modern web applications...

## Checklist

- [ ] Content proofread
- [ ] Images optimized
- [ ] Cover set
- [ ] SEO (title/description/ogImage)
- [ ] Draft flag updated if ready
```

---

## What Gets Created

### MDX File Structure

```yaml
---
title: Your Post Title
slug: your-post-title
date: '2025-11-03'
tags:
  - tag1
  - tag2
excerpt: >-
  Your post excerpt here...
cover: /blog/your-post-title/image.png
ogImage: ''
canonicalUrl: ''
draft: false
---

import Image from 'next/image'
import image1 from './your-post-title/image1.png'
import image2 from './your-post-title/image2.png'

# Your Post Title

Your content here...

<Image src={image1} alt="..." width={800} height={600} />
```

**Key Features:**
- ✅ Single, clean frontmatter block
- ✅ Imports after frontmatter
- ✅ Static imports for all images
- ✅ Valid Next.js/MDX syntax

### Directory Structure

```
project-root/
├── content/blog/
│   ├── your-post-title.mdx
│   └── your-post-title/
│       └── *.png, *.jpg, *.svg
│
├── public/blog/
│   └── your-post-title/
│       └── cover-image.png     # For blog index
│
└── .git/
    └── refs/heads/chore/blog/your-post-title
```

---

## Fixes & Improvements

### ✅ Fixed: Double Frontmatter Issue

**Problem (Before):**
```yaml
---
title: Test Post
excerpt: "import Image from..."  # BROKEN!
---

import Image from 'next/image'
---
title: "Original Post"           # Duplicate!
tags: ["hardware"]
---
```

**Solution (After):**
```yaml
---
title: Original Post             # ✅ Single block
slug: test-post                  # ✅ Generated
tags:                            # ✅ Preserved
  - hardware
excerpt: Original post excerpt   # ✅ Clean text
---

import Image from 'next/image'  # ✅ Correct position
```

**How It Was Fixed:**

The root cause was **incorrect processing order**. The workflow was processing content before extracting frontmatter, causing imports to be inserted in the wrong place.

**New Processing Order:**

1. ⭐ **Extract frontmatter FIRST** (separate from content)
2. ⭐ **Clean content** (remove all frontmatter markers)
3. ⭐ **Process clean content** (fix images, add imports)
4. ⭐ **Rebuild** with single frontmatter block

**Result:** It's now **structurally impossible** to create duplicate frontmatter blocks.

### ✅ New: Interactive Cover Image Selection

**Feature:**

The workflow now asks you to choose a cover image interactively:

```
🎨 Cover Image Selection
The cover image appears in the blog index/listing page.

Options:
  1) Use first image in post directory (auto-detected)
  2) Specify a custom image path
  3) Skip (leave cover empty)
```

**How It Works:**

1. ✅ **Option 1:** Automatically finds and uses the first image in your post directory
2. ✅ **Option 2:** Lets you drag & drop any image file (from anywhere on your computer)
3. ✅ **Option 3:** Skips cover image setup (you can add it manually later)
4. ✅ Copies chosen image to `public/blog/<slug>/`
5. ✅ Sets `cover: /blog/<slug>/image.png` in frontmatter
6. ✅ Includes public directory in git commit

**Result:**
```yaml
cover: /blog/my-post/hero.png  # ✅ Absolute path for blog index
```

**Why `/public`?**

The blog index page (`/blog`) requires absolute paths or paths from `/public`. Relative paths (`./slug/image.png`) don't work in the listing context.

### ✅ Fixed: Image Import Paths

**Problem (Before):**
```javascript
import image from './image.png'  // ❌ Missing slug directory
```

**Solution (After):**
```javascript
import image from './my-post/image.png'  // ✅ Correct!
```

**How It Was Fixed:**

Updated `normalizeImagePath()` function to:

1. ✅ Extract slug directory name
2. ✅ Check if path already includes slug
3. ✅ Add slug directory if missing
4. ✅ Verify image exists
5. ✅ Return correct path: `./<slug>/image.png`

---

## Technical Details

### Architecture

```
┌─────────────────┐
│ User Input      │
│ (MD/MDX file)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 1. EXTRACT      │
│ matter(mdx)     │
│ - frontmatter   │
│ - content       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. CLEAN        │
│ Remove all      │
│ frontmatter     │
│ markers         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. PROCESS      │
│ parseAndFix     │
│ - Fix images    │
│ - Add imports   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. REBUILD      │
│ ensureFrontm.   │
│ - Single FM     │
│ - + Imports     │
│ - + Content     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Output MDX      │
│ Perfect!        │
└─────────────────┘
```

### Key Functions

#### `scripts/blog-utils.mjs`

**Main functions:**

1. **`slugify(title)`** - Convert title to URL-friendly slug
2. **`parseAndFixMarkdown({ mdx, slug, imagesDir })`** - Fix image paths and add static imports
3. **`ensureFrontmatter({ mdx, title, slug, inputFrontmatter })`** - Build complete frontmatter
4. **`normalizeImagePath(imagePath, imagesDir)`** - Ensure correct image paths with slug
5. **`generateExcerpt(content)`** - Extract first paragraph for excerpt
6. **`summarizeForPR({ frontmatter, slug })`** - Generate PR title and body

**Processing flow:**

```javascript
// 1. Extract frontmatter
const parsed = matter(mdx);
let inputFrontmatter = parsed.data || {};
let contentOnly = parsed.content.trim();

// 2. Clean content
contentOnly = contentOnly.replace(/^---\s*\n[\s\S]*?\n---\s*\n/g, '').trim();

// 3. Process images
const { fixedMdx, meta } = parseAndFixMarkdown({
  mdx: contentOnly,
  slug,
  imagesDir,
  contentRoot
});

// 4. Rebuild with frontmatter
const { mdxWithFm, frontmatter } = ensureFrontmatter({
  mdx: fixedMdx,
  title,
  slug,
  imagesDir,
  today: getTodayDate(),
  inputFrontmatter
});
```

### Image Processing Details

**Detection:**

Finds images in three formats:

1. **Markdown:** `![alt](path)`
2. **JSX:** `<Image src="path" />`
3. **HTML:** `<img src="path" />`

**Conversion:**

For markdown images (converted to JSX):
```javascript
// Input (Markdown)
![Hero](./hero.png)

// Generates import
import hero from './my-post/hero.png'

// Converts to Next.js Image component
<Image src={hero} alt="Hero" />
```

For JSX `<Image>` components:
```javascript
// Input
<Image src="./hero.png" alt="Hero" width={800} height={400} />

// Generates import
import hero from './my-post/hero.png'

// Updates tag
<Image src={hero} alt="Hero" width={800} height={400} />
```

**Path Normalization:**

```javascript
// Input variations:
'./image.png'           → './my-post/image.png'
'./my-post/image.png'   → './my-post/image.png' (unchanged)
'image.png'             → './my-post/image.png'
'/absolute/path.png'    → copied + './my-post/path.png'
'https://url.com/img'   → 'https://url.com/img' (unchanged)
```

---

## Troubleshooting

### Issue: Duplicate Frontmatter

**Symptom:**
```yaml
---
title: Generated
---
import Image...
---
title: Original
---
```

**Solution:**

✅ **This is fixed in v4.0!** The workflow now prevents this structurally.

If you have an old broken file:
1. Keep ONLY the frontmatter with real data (usually the second block)
2. Delete all other `---` blocks
3. Ensure imports come after frontmatter
4. Save

### Issue: Images Not Loading

**Symptom:**

```
Error: Invalid src prop on `next/image`, hostname not configured
Error: Failed to parse src "./image.png"
```

**Causes & Solutions:**

1. **Missing slug directory in import path**

   ```javascript
   // ❌ Wrong
   import img from './image.png'
   
   // ✅ Correct
   import img from './my-post/image.png'
   ```

2. **Relative path in `<Image>` without import**

   ```jsx
   // ❌ Wrong
   <Image src="./image.png" />
   
   // ✅ Correct
   import img from './my-post/image.png'
   <Image src={img} />
   ```

3. **Image doesn't exist**

   Check: `content/blog/<slug>/image.png` exists

### Issue: Cover Image Not Showing

**Symptom:**

Blog index page doesn't show thumbnail for your post.

**Causes & Solutions:**

1. **Cover path is empty**

   ```yaml
   # ❌ Wrong
   cover: ''
   
   # ✅ Correct
   cover: /blog/my-post/image.png
   ```

2. **Using relative path**

   ```yaml
   # ❌ Wrong (doesn't work in blog index)
   cover: ./my-post/image.png
   
   # ✅ Correct (absolute from /public)
   cover: /blog/my-post/image.png
   ```

3. **Image not in `/public`**

   Cover images must be in `public/blog/<slug>/`:
   ```bash
   # Copy cover to public
   mkdir -p public/blog/<slug>
   cp content/blog/<slug>/image.png public/blog/<slug>/
   ```

4. **Dev server not restarted**

   ```bash
   # Restart to pick up new public files
   pnpm dev
   ```

### Issue: Workflow Script Won't Run

**Windows: "Execution Policy" Error**

```powershell
# Run with bypass
powershell -ExecutionPolicy Bypass -File scripts/new-post-windows.ps1
```

**Linux/macOS: "Permission Denied"**

```bash
# Make executable
chmod +x scripts/new-post-linux.sh
chmod +x scripts/new-post-macos.sh

# Run
./scripts/new-post-linux.sh
```

### Issue: GitHub PR Fails

**Error:** `gh: not found` or `gh: command not found`

**Solution:**

Install GitHub CLI (see [Prerequisites](#prerequisites))

**Error:** `gh: not authenticated`

**Solution:**

```bash
gh auth login
```

**Error:** `failed to create pull request`

**Possible causes:**

1. Branch already exists on remote
2. No commits to push
3. Not connected to GitHub

**Solutions:**

```bash
# Check remote
git remote -v

# Check branch
git branch -a

# Force push (if needed)
git push -f origin chore/blog/<slug>
```

### Issue: Pasted Content Not Working

**Windows PowerShell Issue:**

For multi-line content, use file mode instead:

```
How would you like to provide the content?
  1) Path to existing .md/.mdx file  ← Use this
  2) Paste Markdown content interactively
```

Or save your content to a file first, then use file mode.

### Issue: Tags Not Preserved

**Symptom:**

Pasted content had tags, but output has `tags: []`

**Cause:**

Tags must be in array format in input frontmatter:

```yaml
# ✅ Correct
tags: ["react", "nextjs"]
# or
tags:
  - react
  - nextjs

# ❌ Wrong (string, not array)
tags: "react, nextjs"
```

**Solution:**

Ensure input frontmatter uses array syntax for tags.

---

## Best Practices

### Writing Posts

1. **Use descriptive titles** - They become the slug
2. **Include frontmatter in source** - It will be preserved
3. **Use relative paths for images** - They'll be fixed automatically
4. **Add alt text** - For accessibility
5. **Optimize images first** - Compress before adding

### Image Management

1. **Use web-friendly formats** - PNG, JPG, WebP, SVG
2. **Compress images** - Use tools like ImageOptim, TinyPNG
3. **Name descriptively** - `hero-image.png` not `IMG_1234.png`
4. **Choose good cover** - First image becomes cover (or rename it to sort first)

### Git & PRs

1. **Review generated MDX** - Check before committing
2. **Use PR checklist** - Complete all items
3. **Preview locally first** - Run `pnpm dev` and test
4. **Keep drafts** - Set `draft: true` until ready

---

## FAQ

### Q: Can I edit the generated MDX?

**A:** Yes! The workflow creates a starting point. Edit as needed.

### Q: How do I change the cover image?

**A:** Either:
1. Rename your desired image to sort first alphabetically
2. Or manually update frontmatter:
   ```yaml
   cover: /blog/<slug>/my-image.png
   ```
   And copy to `public/blog/<slug>/my-image.png`

### Q: Can I skip the PR creation?

**A:** Yes, just say "no" when asked to create PR. You can create it manually later.

### Q: What if I make a mistake?

**A:** Just:
1. Delete the generated files
2. Delete the branch: `git branch -D chore/blog/<slug>`
3. Run the workflow again

### Q: Can I use this for drafts?

**A:** Yes! Set `draft: true` in frontmatter. The post won't appear in production builds.

### Q: Do I need to install remark/rehype plugins?

**A:** No, they're already configured in the project. Just write your MDX.

### Q: Can I use TypeScript in MDX?

**A:** Yes, MDX supports TypeScript. Just use proper type annotations.

---

## Summary

### What This Workflow Does

✅ Creates blog posts with perfect structure  
✅ Fixes all image paths automatically  
✅ Sets cover images for thumbnails  
✅ Preserves your metadata (tags, dates, etc.)  
✅ Creates git branch and commits  
✅ Opens GitHub PR with checklist  
✅ Works on all platforms  

### What Makes It Special

✅ **No manual fixes needed** - Everything is automated  
✅ **Markdown to Next.js conversion** - All images become optimized `<Image>` components  
✅ **Interactive cover selection** - Choose your cover image workflow  
✅ **Smart git workflow** - Auto-syncs with main before and after  
✅ **Prevents common errors** - Duplicate frontmatter, wrong paths  
✅ **Next.js optimized** - Static imports, build-time validation  
✅ **Production ready** - Used and tested  
✅ **Cross-platform** - Linux, macOS, Windows  

### Key Files

- `scripts/blog-utils.mjs` - Core logic
- `scripts/new-post-*.{sh,ps1}` - Platform launchers
- `content/blog/<slug>.mdx` - Your posts
- `content/blog/<slug>/` - Your images
- `public/blog/<slug>/` - Cover images

---

## Need Help?

1. **Check this guide** - Most issues are covered here
2. **Check the codebase** - `scripts/blog-utils.mjs` has comments
3. **Try again** - Delete and rerun if something breaks
4. **Ask the team** - Open an issue or ask in chat

---

**Happy blogging! 🎉**

