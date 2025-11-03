# Excerpt Selection Feature

**Date:** November 3, 2025  
**Status:** ✅ Implemented across all platforms

---

## Overview

Added the ability to write custom excerpts or keep the auto-generated excerpt during the blog post workflow.

### What's an Excerpt?

The excerpt is a short summary of your blog post that appears:
- In the blog index/listing page
- In SEO meta tags (description)
- In social media previews (Open Graph)

---

## Features

### Auto-Generated Excerpt (Default)

The workflow automatically generates an excerpt from the first paragraph of your content:
- Extracts the first meaningful paragraph (>20 chars)
- Strips markdown formatting
- Truncates to 140-200 characters
- Adds "..." if truncated

### Custom Excerpt (Optional)

You can now write your own custom excerpt:
- Full control over the summary text
- Better for SEO optimization
- More engaging for readers
- Can be different from the actual first paragraph

---

## How to Use

### During Workflow

After setting the cover image, you'll see:

```
📝 Excerpt Selection
The excerpt appears in the blog index and SEO metadata.

Current excerpt (auto-generated from first paragraph):
"Your automatically generated excerpt here..."

Options:
  1) Keep auto-generated excerpt
  2) Write custom excerpt

Enter choice (1 or 2):
```

**Option 1: Keep Auto-Generated**
- Press `1` and Enter
- Uses the excerpt automatically generated from your content
- Good for most posts where the first paragraph is descriptive

**Option 2: Write Custom**
- Press `2` and Enter
- You'll be prompted to enter your custom excerpt
- Write a compelling summary (recommend 140-200 characters)
- Press Enter when done

### Example Interaction

```bash
📝 Excerpt Selection
The excerpt appears in the blog index and SEO metadata.

Current excerpt (auto-generated from first paragraph):
"Next.js is already fast out of the box, but there are many techniques..."

Options:
  1) Keep auto-generated excerpt
  2) Write custom excerpt

Enter choice (1 or 2): 2

ℹ Enter your custom excerpt (press Enter when done):
> Learn essential performance optimization techniques for Next.js applications, from image optimization to code splitting strategies.
✓ Custom excerpt set
```

---

## Implementation Details

### Files Modified

1. **`scripts/blog-utils.mjs`**
   - Added `customExcerpt` parameter to `ensureFrontmatter()`
   - Added `update-excerpt` command for updating excerpt in existing MDX files
   - Added `get-excerpt` command for retrieving current excerpt

2. **`scripts/new-post-linux.sh`**
   - Added excerpt selection prompt after cover image
   - Displays current auto-generated excerpt
   - Allows custom input

3. **`scripts/new-post-macos.sh`**
   - Same as Linux (with macOS-specific sed syntax)
   - Added excerpt selection prompt after cover image

4. **`scripts/new-post-windows.ps1`**
   - Added excerpt selection prompt after cover image
   - PowerShell-compatible implementation
   - Also added cover image selection (was missing)

### Priority Order

The excerpt is determined in this priority:

1. **Custom excerpt** (if provided during workflow)
2. **Input frontmatter excerpt** (if pasting content with frontmatter)
3. **Auto-generated excerpt** (from first paragraph)

### Code Example

**In `blog-utils.mjs`:**

```javascript
// Handle excerpt with priority: custom excerpt > input frontmatter > auto-generated
if (customExcerpt && customExcerpt.trim() !== '') {
  // Use custom excerpt provided by user
  data.excerpt = customExcerpt.trim();
} else if (!data.excerpt || data.excerpt.trim() === '') {
  // Generate excerpt from actual content if missing
  data.excerpt = generateExcerpt(content);
}
// Otherwise keep the excerpt from input frontmatter
```

---

## CLI Commands Added

### Get Excerpt

```bash
node scripts/blog-utils.mjs get-excerpt <mdxPath>
```

Returns the current excerpt from the frontmatter.

### Update Excerpt

```bash
node scripts/blog-utils.mjs update-excerpt <mdxPath> <excerpt>
```

Updates the excerpt field in the frontmatter.

**Example:**
```bash
node scripts/blog-utils.mjs update-excerpt content/blog/my-post.mdx "A compelling summary of my post"
```

---

## Best Practices

### Writing Good Excerpts

1. **Length:** Keep it between 140-200 characters
   - Too short: Not descriptive enough
   - Too long: Gets truncated in some contexts

2. **Content:** 
   - Make it compelling and informative
   - Include key topics or benefits
   - Avoid clickbait

3. **Keywords:**
   - Include relevant keywords for SEO
   - Don't keyword stuff
   - Keep it natural

4. **Tone:**
   - Match your post's tone
   - Be clear and direct
   - Avoid technical jargon if possible

### When to Use Custom Excerpts

✅ **Use custom when:**
- First paragraph is technical/code-heavy
- First paragraph doesn't summarize well
- You want better SEO optimization
- You need a specific marketing message

✅ **Use auto-generated when:**
- First paragraph is already a good summary
- You're writing many posts quickly
- Content is straightforward
- Time-saving is priority

---

## Examples

### Auto-Generated (Good)

**First paragraph:**
> Next.js is a powerful React framework that offers built-in performance optimization. However, there are advanced techniques you can use to make your applications even faster.

**Auto-generated excerpt:**
> Next.js is a powerful React framework that offers built-in performance optimization. However, there are advanced techniques you can use to make your applications even faster.

✅ **Good** - The first paragraph already works well as an excerpt

### Custom (Better)

**First paragraph:**
> `import Image from 'next/image'` is the first step to optimizing images in Next.js. Let's explore how to use it effectively.

**Custom excerpt:**
> Learn essential performance optimization techniques for Next.js applications, from image optimization to code splitting strategies.

✅ **Better** - More descriptive and doesn't start with code

---

## Testing

### Test Scenario 1: Keep Auto-Generated

```bash
# Run workflow
./scripts/new-post-macos.sh

# When prompted for excerpt:
Enter choice (1 or 2): 1

# Result: Uses auto-generated excerpt
```

✅ **Pass** - Auto-generated excerpt preserved

### Test Scenario 2: Write Custom

```bash
# Run workflow
./scripts/new-post-linux.sh

# When prompted for excerpt:
Enter choice (1 or 2): 2
> My custom excerpt here

# Result: Uses custom excerpt
```

✅ **Pass** - Custom excerpt set in frontmatter

### Test Scenario 3: Empty Custom

```bash
# When prompted for excerpt:
Enter choice (1 or 2): 2
> [just press Enter]

# Result: Keeps auto-generated excerpt
```

✅ **Pass** - Falls back to auto-generated if empty

---

## Workflow Integration

The excerpt selection fits into the workflow at this point:

```
1. Enter post title
2. Provide content (file or paste)
3. Process post (fix images, generate frontmatter)
4. Image management (copy images to post directory)
5. Cover image selection ⬅️ Before
6. Excerpt selection ⬅️ NEW STEP
7. Git operations (branch, commit, push)
8. Create PR
```

---

## Impact on Existing Workflow

### Backward Compatible

✅ **No breaking changes:**
- Existing posts unaffected
- Auto-generation still works
- Optional feature (can skip by choosing option 1)

### Performance

✅ **Minimal impact:**
- Adds ~2 seconds to workflow (user input time)
- No computational overhead
- Single file read/write

### User Experience

✅ **Better control:**
- See the auto-generated excerpt before deciding
- Can improve it if needed
- Simple two-option choice

---

## Future Enhancements

Potential improvements:

1. **Multi-line input** - Allow longer excerpts with line breaks
2. **Excerpt templates** - Pre-defined excerpt formats
3. **AI suggestions** - Use AI to suggest better excerpts
4. **Preview mode** - Show how excerpt looks in blog index
5. **Character counter** - Real-time character count while typing

---

## Summary

### What Was Added

✅ Excerpt selection prompt in all platform scripts  
✅ Custom excerpt support in `blog-utils.mjs`  
✅ CLI commands for get/update excerpt  
✅ Display of auto-generated excerpt before choosing  
✅ Windows script also got cover image selection (was missing)  

### What Works Now

✅ Choose to keep auto-generated excerpt  
✅ Write custom excerpt during workflow  
✅ Excerpts preserved from pasted frontmatter  
✅ All platforms consistent (Linux, macOS, Windows)  

### Benefits

✅ **Better SEO** - Optimized excerpts for search engines  
✅ **More control** - Full control over post summary  
✅ **Flexibility** - Auto or custom, your choice  
✅ **Easy to use** - Simple two-option prompt  

---

**Status:** ✅ Production Ready  
**Platforms:** Linux, macOS, Windows  
**Version:** 1.0

