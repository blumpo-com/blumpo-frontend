#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert title to URL-friendly slug
 */
export function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Walk up directories to find repository root (contains .git)
 */
export function detectRepoRoot(cwd = process.cwd()) {
  let current = path.resolve(cwd);
  const root = path.parse(current).root;

  while (current !== root) {
    if (fs.existsSync(path.join(current, '.git'))) {
      return current;
    }
    current = path.dirname(current);
  }

  throw new Error('Could not find .git directory. Are you in a git repository?');
}

/**
 * Ensure blog post directories exist
 */
export function ensureDirs(root, slug) {
  const contentDir = path.join(root, 'content', 'blog');
  const mdxPath = path.join(contentDir, `${slug}.mdx`);
  const imagesDir = path.join(contentDir, slug);

  // Check if post already exists
  if (fs.existsSync(mdxPath)) {
    throw new Error(
      `Post already exists: ${mdxPath}\nPlease use a different title or delete the existing post.`
    );
  }

  // Create directories
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  return { mdxPath, imagesDir };
}

/**
 * Read markdown source from file or stdin
 */
export async function readMarkdownSource(mode, source) {
  if (mode === 'file') {
    if (!source) {
      throw new Error('File path required for file mode');
    }
    if (!fs.existsSync(source)) {
      throw new Error(`File not found: ${source}`);
    }
    return fs.readFileSync(source, 'utf8');
  } else if (mode === 'stdin') {
    // Content should be provided via source parameter when called from scripts
    return source || '';
  }
  throw new Error('Invalid mode. Use "file" or "stdin"');
}

/**
 * Decode URL-encoded path to get actual filename
 */
function decodeImagePath(imagePath) {
  try {
    // Decode URL encoding (e.g., %20 -> space, %28 -> (, etc.)
    return decodeURIComponent(imagePath);
  } catch (e) {
    // If decoding fails, return original
    return imagePath;
  }
}

/**
 * Find all image references in markdown and JSX
 */
function findImageReferences(content) {
  const images = [];
  
  // Match ![alt](path)
  // Use a regex that handles parentheses in filenames by matching up to the last ) on the line
  // or before whitespace/newline, prioritizing complete file paths
  const markdownImagePattern = /!\[([^\]]*)\]\(/g;
  let match;
  
  while ((match = markdownImagePattern.exec(content)) !== null) {
    const startPos = match.index;
    const altText = match[1];
    const urlStart = match.index + match[0].length;
    
    // Find the line end or next significant character
    const lineEnd = content.indexOf('\n', urlStart);
    const searchEnd = lineEnd > 0 ? lineEnd : content.length;
    const urlSection = content.substring(urlStart, searchEnd);
    
    // Try to find the best closing parenthesis
    // Look for ) that completes a valid file path (has extension) or is at the end
    let bestMatch = null;
    let bestIndex = -1;
    
    for (let i = 0; i < urlSection.length; i++) {
      if (urlSection[i] === ')') {
        const candidate = urlSection.substring(0, i).trim();
        // If it looks like a complete file path, prefer this match
        // Match image extensions (including .avif) - extension should be at end or followed by query/hash
        if (candidate.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|#|$)/i)) {
          bestMatch = candidate;
          bestIndex = i;
          break; // Take the first complete path match
        } else if (bestIndex === -1) {
          // Store first ) as fallback
          bestMatch = candidate;
          bestIndex = i;
        }
      }
    }
    
    if (bestMatch !== null) {
      const fullMatch = content.substring(startPos, urlStart + bestIndex + 1);
      let url = bestMatch.split(/[?#]/)[0].trim();
      // Decode URL-encoded characters
      url = decodeImagePath(url);
      
      images.push({
        full: fullMatch,
        alt: altText,
        path: url,
        original: url,
        type: 'markdown'
      });
    } else {
      // Fallback: try standard regex
      const remaining = content.substring(startPos);
      const simpleMatch = remaining.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (simpleMatch) {
        let url = simpleMatch[2].split(/[?#]/)[0].trim();
        // Decode URL-encoded characters
        url = decodeImagePath(url);
        images.push({
          full: simpleMatch[0],
          alt: simpleMatch[1],
          path: url,
          original: url,
          type: 'markdown'
        });
      }
    }
  }
  
  // Match <Image src="path" ... /> (JSX Image component)
  const jsxImages = content.matchAll(/<Image[^>]*\ssrc=["']([^"']+)["'][^>]*\/?>/gi);
  for (const match of jsxImages) {
    let src = match[1].split(/[?#]/)[0].trim();
    // Decode URL-encoded characters
    src = decodeImagePath(src);
    // Skip if already using a variable (starts with {)
    if (!src.startsWith('{')) {
      images.push({
        full: match[0],
        alt: '',
        path: src,
        original: match[1],
        type: 'jsx'
      });
    }
  }
  
  // Match <img src="path" ... /> (regular HTML)
  const htmlImages = content.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*\/?>/gi);
  for (const match of htmlImages) {
    let src = match[1].split(/[?#]/)[0].trim();
    // Decode URL-encoded characters
    src = decodeImagePath(src);
    images.push({
      full: match[0],
      alt: '',
      path: src,
      original: match[1],
      type: 'html'
    });
  }
  
  return images;
}

/**
 * Normalize path to be relative to images directory
 */
function normalizeImagePath(imagePath, imagesDir, contentRoot) {
  // Skip URLs
  if (/^https?:\/\//i.test(imagePath)) {
    return { normalized: imagePath, needsCopy: false };
  }

  // Decode URL-encoded characters first
  let decodedPath = decodeImagePath(imagePath);
  
  // Convert Windows paths to forward slashes
  let normalized = decodedPath.replace(/\\/g, '/');
  
  // Get slug directory name
  const slugDir = path.basename(imagesDir);
  
  // If already correctly formatted (./slug/image.png), check if file exists and use actual filename
  if (normalized.startsWith(`./${slugDir}/`)) {
    const fileNameFromPath = normalized.substring(`./${slugDir}/`.length);
    const targetPath = path.join(imagesDir, fileNameFromPath);
    
    // If file exists, use the actual filename from filesystem
    if (fs.existsSync(targetPath)) {
      const actualFileName = path.basename(targetPath);
      return {
        normalized: `./${slugDir}/${actualFileName}`,
        needsCopy: false
      };
    }
    
    // File doesn't exist, but path is already normalized, return as-is
    return { normalized, needsCopy: false };
  }
  
  // If starts with ./ but missing slug directory, fix it
  if (normalized.startsWith('./')) {
    // Remove leading ./
    const fileName = normalized.substring(2);
    // Check if the file exists in images directory
    const targetPath = path.join(imagesDir, fileName);
    if (fs.existsSync(targetPath)) {
      // Use actual filename from filesystem
      const actualFileName = path.basename(targetPath);
      return {
        normalized: `./${slugDir}/${actualFileName}`,
        needsCopy: false
      };
    }
  }
  
  // If starts with ../, leave as-is
  if (normalized.startsWith('../')) {
    return { normalized, needsCopy: false };
  }

  // Try to resolve as absolute or relative to content root
  let resolvedPath;
  if (path.isAbsolute(decodedPath)) {
    resolvedPath = decodedPath;
  } else {
    resolvedPath = path.resolve(contentRoot, decodedPath);
  }

  // Check if file exists
  if (fs.existsSync(resolvedPath)) {
    // Use actual filename from filesystem
    const actualFileName = path.basename(resolvedPath);
    const targetPath = path.join(imagesDir, actualFileName);
    
    return {
      normalized: `./${slugDir}/${actualFileName}`,
      needsCopy: true,
      sourcePath: resolvedPath,
      targetPath
    };
  }

  // File doesn't exist, try to find it by decoding and searching
  // Extract just the filename part
  const fileNameFromPath = path.basename(decodedPath);
  
  // Check if a file with this name (or decoded version) exists in images directory
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    // Try to find matching file (case-insensitive, handle encoding variations)
    const matchingFile = files.find(file => {
      const fileBase = path.basename(file, path.extname(file));
      const pathBase = path.basename(fileNameFromPath, path.extname(fileNameFromPath));
      return fileBase.toLowerCase() === pathBase.toLowerCase() && 
             path.extname(file).toLowerCase() === path.extname(fileNameFromPath).toLowerCase();
    });
    
    if (matchingFile) {
      return {
        normalized: `./${slugDir}/${matchingFile}`,
        needsCopy: false
      };
    }
  }
  
  // File doesn't exist, use decoded filename
  return {
    normalized: `./${slugDir}/${fileNameFromPath}`,
    needsCopy: false
  };
}

/**
 * Convert path to valid variable name
 */
function pathToVarName(imagePath) {
  const basename = path.basename(imagePath, path.extname(imagePath));
  return basename
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/^(\d)/, '_$1') // Prefix if starts with number
    .replace(/_+/g, '_'); // Collapse multiple underscores
}

/**
 * Parse markdown and fix image paths with static imports
 */
export function parseAndFixMarkdown({ mdx, slug, imagesDir, contentRoot }) {
  const images = findImageReferences(mdx);
  let fixedMdx = mdx;
  const copiedImages = [];
  const imports = [];
  const imageVarMap = new Map();

  for (const img of images) {
    const { normalized, needsCopy, sourcePath, targetPath } = normalizeImagePath(
      img.path,
      imagesDir,
      contentRoot
    );

    if (needsCopy && sourcePath && targetPath) {
      // Copy image if it doesn't exist in target
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
        copiedImages.push(path.basename(targetPath));
      }
    }

    // For JSX Image components, use static imports
    if (img.type === 'jsx' && normalized.startsWith('./')) {
      const varName = pathToVarName(normalized);
      
      // Only add import once per unique image
      if (!imageVarMap.has(normalized)) {
        imageVarMap.set(normalized, varName);
        imports.push(`import ${varName} from '${normalized}'`);
      }
      
      const usedVarName = imageVarMap.get(normalized);
      // Replace src="./path" with src={varName}
      const newFull = img.full.replace(
        /src=["']([^"']+)["']/,
        `src={${usedVarName}}`
      );
      fixedMdx = fixedMdx.replace(img.full, newFull);
    }
    // Convert markdown images to Next.js Image components with static imports
    else if (img.type === 'markdown' && normalized.startsWith('./')) {
      const varName = pathToVarName(normalized);
      
      // Only add import once per unique image
      if (!imageVarMap.has(normalized)) {
        imageVarMap.set(normalized, varName);
        imports.push(`import ${varName} from '${normalized}'`);
      }
      
      const usedVarName = imageVarMap.get(normalized);
      // Convert ![alt](path) to <Image src={varName} alt="alt" />
      const altText = img.alt || '';
      const newFull = `<Image src={${usedVarName}} alt="${altText}" />`;
      fixedMdx = fixedMdx.replace(img.full, newFull);
    }
    // For markdown images with external URLs, keep as-is
    else if (img.type === 'markdown' && !normalized.startsWith('./')) {
      if (normalized !== img.path) {
        const newPath = img.original.replace(img.path, normalized);
        const newFull = `![${img.alt}](${newPath})`;
        fixedMdx = fixedMdx.replace(img.full, newFull);
      }
    }
    // For HTML images, update path
    else if (img.type === 'html' && normalized !== img.path) {
      const newPath = img.original.replace(img.path, normalized);
      const newFull = img.full.replace(img.original, newPath);
      fixedMdx = fixedMdx.replace(img.full, newFull);
    }
  }

  // Add imports at the start of content (no frontmatter at this point)
  if (imports.length > 0) {
    // Check if there's already an import section
    const existingImportMatch = fixedMdx.match(/^(\s*import\s+.*\n)+/);
    
    if (existingImportMatch) {
      // Add after existing imports
      const insertPosition = existingImportMatch[0].length;
      const importBlock = imports.join('\n') + '\n';
      fixedMdx = fixedMdx.substring(0, insertPosition) + importBlock + fixedMdx.substring(insertPosition);
    } else {
      // Add at the start with Image import
      const importBlock = 'import Image from \'next/image\'\n' + imports.join('\n') + '\n\n';
      fixedMdx = importBlock + fixedMdx;
    }
  }

  return {
    fixedMdx,
    meta: {
      imagesFound: images.length,
      imagesCopied: copiedImages.length,
      copiedImages,
      importsAdded: imports.length
    }
  };
}

/**
 * Remove "# Untitled" or "#Untitled" heading if it appears as the first heading
 */
export function removeUntitledHeading(content) {
  if (!content) return content;
  
  const lines = content.split('\n');
  let firstHeadingIndex = -1;
  
  // Find the first heading (line starting with #)
  // Skip import statements
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and import statements
    if (line === '' || line.startsWith('import ')) {
      continue;
    }
    
    // Check if this is a heading
    if (line.startsWith('#')) {
      firstHeadingIndex = i;
      break;
    }
  }
  
  // If we found a first heading, check if it's "Untitled"
  if (firstHeadingIndex !== -1) {
    const headingLine = lines[firstHeadingIndex].trim();
    // Match "# Untitled" or "#Untitled" (case insensitive, with optional spaces)
    const untitledMatch = headingLine.match(/^#+\s*[Uu]ntitled\s*$/);
    
    if (untitledMatch) {
      // Remove the line
      lines.splice(firstHeadingIndex, 1);
      
      // Remove any following blank lines (up to 2)
      let removedBlanks = 0;
      while (firstHeadingIndex < lines.length && 
             lines[firstHeadingIndex].trim() === '' && 
             removedBlanks < 2) {
        lines.splice(firstHeadingIndex, 1);
        removedBlanks++;
      }
      
      return lines.join('\n');
    }
  }
  
  return content;
}

/**
 * Strip markdown formatting to plain text
 */
function stripMarkdown(text) {
  return text
    .replace(/^#+\s+/gm, '') // Headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1') // Italic
    .replace(/~~(.+?)~~/g, '$1') // Strikethrough
    .replace(/`(.+?)`/g, '$1') // Inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
    .replace(/!\[.*?\]\(.+?\)/g, '') // Images
    .replace(/^[-*+]\s+/gm, '') // Lists
    .replace(/^\d+\.\s+/gm, '') // Numbered lists
    .replace(/^>\s+/gm, '') // Blockquotes
    .replace(/\n+/g, ' ') // Multiple newlines
    .trim();
}

/**
 * Generate excerpt from first paragraph
 */
function generateExcerpt(content) {
  // Content should already be clean (no frontmatter)
  // Get first paragraph
  const paragraphs = content.split(/\n\n+/);
  let firstPara = '';
  
  for (const para of paragraphs) {
    const stripped = stripMarkdown(para.trim());
    if (stripped.length > 20) {
      firstPara = stripped;
      break;
    }
  }
  
  if (!firstPara) return '';
  
  // Clamp to 140-200 chars
  if (firstPara.length <= 200) return firstPara;
  
  const truncated = firstPara.substring(0, 197);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 140 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

/**
 * Find first image in images directory
 */
function findFirstImage(imagesDir) {
  if (!fs.existsSync(imagesDir)) return null;
  
  const files = fs.readdirSync(imagesDir);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
  
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (imageExtensions.includes(ext)) {
      return `./${path.basename(imagesDir)}/${file}`;
    }
  }
  
  return null;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Ensure frontmatter is present and complete
 */
export function ensureFrontmatter({ mdx, title, slug, imagesDir, today, inputFrontmatter = {}, customExcerpt = null }) {
  // Content should already be clean (no frontmatter) at this point
  let content = mdx.trim();
  
  // Start with input frontmatter if provided
  let data = { ...inputFrontmatter };
  
  // Extract any import statements that parseAndFixMarkdown added
  const importMatch = content.match(/^(import\s+.*\n)+/);
  let imports = '';
  if (importMatch) {
    imports = importMatch[0];
    content = content.substring(importMatch[0].length).trim();
  }
  
  // Now clean up the data, preferring input frontmatter but overriding key fields
  
  // If input has a title and it's substantial, use it; otherwise use workflow title
  if (!data.title || data.title.trim() === '') {
    data.title = title;
  }
  // Note: We prefer the title from the pasted content if it exists
  
  // Always use generated slug for consistency
  data.slug = slug;
  
  // Use date from input if valid, otherwise today
  if (!data.date || data.date === '') {
    data.date = today || getTodayDate();
  }
  
  // Use tags from input if present
  if (!data.tags || !Array.isArray(data.tags) || data.tags.length === 0) {
    data.tags = [];
  }
  
  // Handle excerpt with priority: custom excerpt > input frontmatter > auto-generated
  if (customExcerpt && customExcerpt.trim() !== '') {
    // Use custom excerpt provided by user
    data.excerpt = customExcerpt.trim();
  } else if (!data.excerpt || data.excerpt.trim() === '') {
    // Generate excerpt from actual content if missing
    data.excerpt = generateExcerpt(content);
  }
  // Otherwise keep the excerpt from input frontmatter
  
  // Setup cover image: Only use if explicitly provided in input frontmatter
  // The workflow script will handle cover image selection interactively
  if (!data.cover || data.cover.trim() === '') {
    data.cover = '';
  }
  
  if (!data.ogImage) data.ogImage = '';
  if (!data.canonicalUrl) data.canonicalUrl = '';
  if (data.draft === undefined) data.draft = false;
  
  // Rebuild: frontmatter + imports + content
  const contentWithImports = imports ? imports + '\n' + content : content;
  const mdxWithFm = matter.stringify(contentWithImports, data);
  
  return {
    mdxWithFm,
    frontmatter: data
  };
}

/**
 * Write post files
 */
export function writePostFiles({ mdxPath, mdxContent }) {
  fs.writeFileSync(mdxPath, mdxContent, 'utf8');
}

/**
 * Validate MDX file for unconverted image links
 * Checks for markdown links or images that should have been converted to imports
 */
export function validateImageLinks(mdxPath) {
  const content = fs.readFileSync(mdxPath, 'utf8');
  let parsed;
  try {
    parsed = matter(content);
  } catch (error) {
    // If YAML parsing fails, try to extract content manually
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (frontmatterMatch) {
      parsed = { content: frontmatterMatch[2] };
    } else {
      // No frontmatter, use entire content
      parsed = { content };
    }
  }
  const bodyContent = parsed.content;
  
  const issues = [];
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|#|$)/i;
  
  // Check for markdown links that look like images (have image extensions)
  // Pattern: [text](path.extension)
  const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = markdownLinkPattern.exec(bodyContent)) !== null) {
    const linkText = match[1];
    const linkPath = match[2];
    
    // Check if the link text or path contains an image extension
    if (imageExtensions.test(linkText) || imageExtensions.test(linkPath)) {
      // Skip if it's already a URL (http/https)
      if (!/^https?:\/\//i.test(linkPath)) {
        issues.push({
          type: 'unconverted_link',
          line: bodyContent.substring(0, match.index).split('\n').length,
          text: match[0],
          message: `Found unconverted image link: ${match[0]}. Should be converted to <Image> component with import.`
        });
      }
    }
  }
  
  // Check for markdown images that weren't converted (shouldn't happen, but check anyway)
  const markdownImagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  while ((match = markdownImagePattern.exec(bodyContent)) !== null) {
    const imagePath = match[2];
    
    // Skip if it's a URL
    if (!/^https?:\/\//i.test(imagePath)) {
      // Check if it's a relative path that should have been converted
      if (imagePath.startsWith('./') || !imagePath.startsWith('/')) {
        issues.push({
          type: 'unconverted_image',
          line: bodyContent.substring(0, match.index).split('\n').length,
          text: match[0],
          message: `Found unconverted markdown image: ${match[0]}. Should be converted to <Image> component with import.`
        });
      }
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}


/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'slugify': {
        const title = args.slice(1).join(' ');
        console.log(slugify(title));
        break;
      }

      case 'detect-root': {
        console.log(detectRepoRoot());
        break;
      }

      case 'ensure-dirs': {
        const root = args[1];
        const slug = args[2];
        const result = ensureDirs(root, slug);
        console.log(JSON.stringify(result));
        break;
      }

      case 'process': {
        // Usage: node blog-utils.mjs process <root> <title> <slug> <mode> [source]
        const root = args[1];
        const title = args[2];
        const slug = args[3];
        const mode = args[4];
        const source = args[5];

        const { mdxPath, imagesDir } = ensureDirs(root, slug);
        const contentRoot = path.join(root, 'content', 'blog');

        let mdx = await readMarkdownSource(mode, source);

        // STEP 1: Extract frontmatter and content separately FIRST
        const parsed = matter(mdx);
        let inputFrontmatter = parsed.data || {};
        let contentOnly = parsed.content.trim();
        
        // Clean any remaining frontmatter markers from content
        contentOnly = contentOnly.replace(/^---\s*\n[\s\S]*?\n---\s*\n/g, '').trim();

        // Remove "# Untitled" heading if present
        contentOnly = removeUntitledHeading(contentOnly);

        // STEP 2: Fix image paths in CLEAN content (no frontmatter)
        const { fixedMdx, meta } = parseAndFixMarkdown({
          mdx: contentOnly,
          slug,
          imagesDir,
          contentRoot
        });

        // STEP 3: Rebuild with clean frontmatter
        const { mdxWithFm, frontmatter } = ensureFrontmatter({
          mdx: fixedMdx,
          title,
          slug,
          imagesDir,
          today: getTodayDate(),
          inputFrontmatter // Pass the extracted frontmatter
        });

        // Write files
        writePostFiles({ mdxPath, mdxContent: mdxWithFm });

        // Validate for unconverted image links
        const validation = validateImageLinks(mdxPath);
        
        // Output result
        const result = {
          success: true,
          mdxPath,
          imagesDir,
          meta,
          frontmatter
        };
        
        if (!validation.valid) {
          result.warnings = validation.issues;
        }
        
        console.log(JSON.stringify(result));
        break;
      }

      case 'update-excerpt': {
        // Usage: node blog-utils.mjs update-excerpt <mdxPath> <excerpt>
        const mdxPath = args[1];
        const newExcerpt = args.slice(2).join(' ');
        
        const content = fs.readFileSync(mdxPath, 'utf8');
        const parsed = matter(content);
        
        // Update excerpt
        parsed.data.excerpt = newExcerpt;
        
        // Rebuild file
        const updated = matter.stringify(parsed.content, parsed.data);
        fs.writeFileSync(mdxPath, updated, 'utf8');
        
        console.log(JSON.stringify({ success: true, excerpt: newExcerpt }));
        break;
      }

      case 'get-excerpt': {
        // Usage: node blog-utils.mjs get-excerpt <mdxPath>
        const mdxPath = args[1];
        const content = fs.readFileSync(mdxPath, 'utf8');
        const parsed = matter(content);
        console.log(parsed.data.excerpt || '');
        break;
      }

      case 'validate-images': {
        // Usage: node blog-utils.mjs validate-images <mdxPath>
        const mdxPath = args[1];
        if (!mdxPath) {
          console.error('Error: MDX path required');
          process.exit(1);
        }
        
        if (!fs.existsSync(mdxPath)) {
          console.error(`Error: File not found: ${mdxPath}`);
          process.exit(1);
        }
        
        const validation = validateImageLinks(mdxPath);
        console.log(JSON.stringify(validation));
        break;
      }

      default:
        console.error('Unknown command:', command);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
const scriptPath = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === scriptPath;

if (isMainModule) {
  main();
}

