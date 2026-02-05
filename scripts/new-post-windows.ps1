# Blog Post Submission Workflow - Windows Version
# Usage: powershell -ExecutionPolicy Bypass -File scripts/new-post-windows.ps1

$ErrorActionPreference = "Stop"

# Color functions
function Write-Error-Custom {
    param([string]$Message)
    Write-Host "X Error: $Message" -ForegroundColor Red
    exit 1
}

function Write-Success {
    param([string]$Message)
    Write-Host "+ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "i $Message" -ForegroundColor Blue
}

function Write-Warn {
    param([string]$Message)
    Write-Host "! $Message" -ForegroundColor Yellow
}

# Check prerequisites
try {
    $null = Get-Command node -ErrorAction Stop
} catch {
    Write-Error-Custom "node is required but not installed. Install: https://nodejs.org/"
}

try {
    $null = Get-Command git -ErrorAction Stop
} catch {
    Write-Error-Custom "git is required but not installed"
}

try {
    $null = Get-Command gh -ErrorAction Stop
} catch {
    Write-Error-Custom "gh (GitHub CLI) is required but not installed. Install: https://cli.github.com/"
}

# Check gh authentication
$ghAuthStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "GitHub CLI not authenticated. Run: gh auth login"
}

Write-Host ""
Write-Host "============================================"
Write-Host "   Blog Post Submission Workflow"
Write-Host "         (Windows Version)"
Write-Host "============================================"
Write-Host ""
Write-Warn "DEPRECATED: Use Sanity Studio to add new blog posts. See docs/BLOG-SANITY-MIGRATION.md"
Write-Host ""

# Detect repository root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$UtilsScript = Join-Path $ScriptDir "blog-utils.mjs"

try {
    $RepoRoot = node $UtilsScript detect-root 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not in a git repository"
    }
    Write-Success "Repository root: $RepoRoot"
} catch {
    Write-Error-Custom "Not in a git repository"
}

# Ensure we're on main and up to date
Set-Location $RepoRoot
$CurrentBranch = git branch --show-current
if ($CurrentBranch -ne "main") {
    Write-Info "Switching to main branch..."
    git checkout main 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to checkout main"
    }
}
Write-Info "Pulling latest changes from main..."
git pull origin main 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Could not pull from main (continuing anyway)"
}
Write-Success "Ready to create new post"

# Get post title
Write-Host ""
$PostTitle = Read-Host "Enter post title"
if ([string]::IsNullOrWhiteSpace($PostTitle)) {
    Write-Error-Custom "Post title cannot be empty"
}

# Generate slug
$Slug = node $UtilsScript slugify $PostTitle
Write-Success "Generated slug: $Slug"

# Choose input mode
Write-Host ""
Write-Info "How would you like to provide the content?"
Write-Host "  1. Path to existing .md/.mdx file"
Write-Host "  2. Paste Markdown content interactively"
$InputMode = Read-Host "Enter choice 1 or 2"

$MarkdownContent = ""
$SourceMode = ""

if ($InputMode -eq "1") {
    $FilePath = Read-Host "Enter path to markdown file"
    if (-not (Test-Path $FilePath)) {
        Write-Error-Custom "File not found: $FilePath"
    }
    $SourceMode = "file"
    $MarkdownContent = $FilePath
    Write-Success "File loaded: $FilePath"
} elseif ($InputMode -eq "2") {
    Write-Host ""
    Write-Info "Paste your Markdown content below."
    Write-Info "When finished, type EOF on a new line and press Enter."
    Write-Host ""
    
    $TempContent = @()
    while ($true) {
        $line = Read-Host
        if ($line -eq "EOF") {
            break
        }
        $TempContent += $line
    }
    
    $SourceMode = "stdin"
    $MarkdownContent = $TempContent -join "`n"
    $lineCount = $TempContent.Count
    Write-Success "Content received $lineCount lines"
} else {
    Write-Error-Custom "Invalid choice. Please enter 1 or 2."
}

# Process the post
Write-Host ""
Write-Info "Processing post..."

try {
    if ($SourceMode -eq "file") {
        $Result = node $UtilsScript process $RepoRoot $PostTitle $Slug "file" $MarkdownContent 2>&1 | Out-String
    } else {
        # For stdin mode, write content to a temp file to avoid command-line parsing issues
        $TempFile = Join-Path $env:TEMP "blog-post-temp-$([guid]::NewGuid()).md"
        $MarkdownContent | Out-File -FilePath $TempFile -Encoding UTF8 -NoNewline
        
        try {
            $Result = node $UtilsScript process $RepoRoot $PostTitle $Slug "file" $TempFile 2>&1 | Out-String
        } finally {
            # Clean up temp file
            if (Test-Path $TempFile) {
                Remove-Item $TempFile -Force
            }
        }
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw $Result
    }
    
    $ResultJson = $Result | ConvertFrom-Json
    $MdxPath = $ResultJson.mdxPath
    $ImagesDir = $ResultJson.imagesDir
    $Meta = $ResultJson.meta
    
    Write-Success "Created: $MdxPath"
    Write-Success "Images directory: $ImagesDir"
    
    if ($Meta.importsAdded -gt 0) {
        Write-Info "Added $($Meta.importsAdded) static image imports for Next.js optimization"
    }
    
    if ($Meta.imagesCopied -gt 0) {
        Write-Info "Copied $($Meta.imagesCopied) images to post directory"
    }
    
    if ($ResultJson.frontmatter.cover -ne '') {
        Write-Info "Cover image set: $($ResultJson.frontmatter.cover)"
    }
} catch {
    Write-Error-Custom "Failed to process post: $_"
}

# Prompt for images
Write-Host ""
Write-Info "Image Management"
Write-Host "Options:"
Write-Host "  1. I will copy images manually (press Enter when done)"
Write-Host "  2. Copy images from a directory"
Write-Host "  3. Skip (no images)"
$ImageMode = Read-Host "Enter choice 1, 2, or 3"

if ($ImageMode -eq "1") {
    Write-Host ""
    Write-Info "Copy your images to: $ImagesDir"
    Read-Host "Press Enter when you have added all images"
    Write-Success "Continuing..."
} elseif ($ImageMode -eq "2") {
    $ImagesSource = Read-Host "Enter path to images directory"
    if (-not (Test-Path $ImagesSource)) {
        Write-Warn "Directory not found: $ImagesSource. Skipping..."
    } else {
        try {
            Copy-Item -Path "$ImagesSource\*" -Destination $ImagesDir -ErrorAction SilentlyContinue
            Write-Success "Images copied from $ImagesSource"
        } catch {
            Write-Warn "No images copied or copy failed"
        }
    }
} elseif ($ImageMode -eq "3") {
    Write-Info "Skipping images"
} else {
    Write-Warn "Invalid choice. Skipping images..."
}

# Cover image selection
Write-Host ""
Write-Info "Cover Image Selection"
Write-Host "The cover image appears in the blog index/listing page."
Write-Host ""
Write-Host "Options:"
Write-Host "  1. Use first image in post directory (auto-detected)"
Write-Host "  2. Specify a custom image path"
Write-Host "  3. Skip (leave cover empty)"
$CoverMode = Read-Host "Enter choice 1, 2, or 3"

$CoverImage = ""
if ($CoverMode -eq "1") {
    # Find first image
    $FirstImage = Get-ChildItem -Path $ImagesDir -File | Where-Object {
        $_.Extension -match '\.(jpg|jpeg|png|gif|webp|svg)$'
    } | Select-Object -First 1
    
    if ($FirstImage) {
        $ImageFilename = $FirstImage.Name
        # Copy to public directory
        $PublicDir = Join-Path $RepoRoot "public\blog\$Slug"
        New-Item -ItemType Directory -Path $PublicDir -Force | Out-Null
        Copy-Item -Path $FirstImage.FullName -Destination $PublicDir -Force
        $CoverImage = "/blog/$Slug/$ImageFilename"
        Write-Success "Cover set: $CoverImage"
    } else {
        Write-Warn "No images found in post directory"
    }
} elseif ($CoverMode -eq "2") {
    $CoverPath = Read-Host "Enter path to cover image"
    if (Test-Path $CoverPath) {
        $ImageFilename = Split-Path -Leaf $CoverPath
        # Copy to public directory
        $PublicDir = Join-Path $RepoRoot "public\blog\$Slug"
        New-Item -ItemType Directory -Path $PublicDir -Force | Out-Null
        Copy-Item -Path $CoverPath -Destination $PublicDir -Force
        $CoverImage = "/blog/$Slug/$ImageFilename"
        Write-Success "Cover set: $CoverImage"
    } else {
        Write-Warn "File not found: $CoverPath. Skipping cover..."
    }
} elseif ($CoverMode -eq "3") {
    Write-Info "Skipping cover image"
} else {
    Write-Warn "Invalid choice. Skipping cover image..."
}

# Update MDX file with cover image if set
if ($CoverImage -ne "") {
    # Update the cover field in frontmatter
    $MdxContent = Get-Content -Path $MdxPath -Raw
    $MdxContent = $MdxContent -replace "^cover: ''$", "cover: $CoverImage"
    Set-Content -Path $MdxPath -Value $MdxContent -NoNewline
    Write-Info "Updated frontmatter with cover image"
}

# Excerpt selection
Write-Host ""
Write-Info "Excerpt Selection"
Write-Host "The excerpt appears in the blog index and SEO metadata."
Write-Host ""

# Get current auto-generated excerpt
$CurrentExcerpt = node $UtilsScript get-excerpt $MdxPath
Write-Host "Current excerpt (auto-generated from first paragraph):"
Write-Host "`"$CurrentExcerpt`""
Write-Host ""

Write-Host "Options:"
Write-Host "  1. Keep auto-generated excerpt"
Write-Host "  2. Write custom excerpt"
$ExcerptMode = Read-Host "Enter choice 1 or 2"

if ($ExcerptMode -eq "2") {
    Write-Host ""
    Write-Info "Enter your custom excerpt (press Enter when done):"
    $CustomExcerpt = Read-Host ">"
    
    if ($CustomExcerpt) {
        node $UtilsScript update-excerpt $MdxPath $CustomExcerpt | Out-Null
        Write-Success "Custom excerpt set"
    } else {
        Write-Info "Keeping auto-generated excerpt"
    }
} elseif ($ExcerptMode -eq "1") {
    Write-Info "Keeping auto-generated excerpt"
} else {
    Write-Warn "Invalid choice. Keeping auto-generated excerpt..."
}

# Git operations
Write-Host ""
Write-Info "Git Operations"

# Add timestamp to branch name to allow multiple posts with same slug
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BranchName = "chore/blog/$Slug-$Timestamp"

# Ensure we are on a clean state
Set-Location $RepoRoot
git fetch origin 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Could not fetch from origin"
}

# Create and checkout branch
# Check if branch exists (suppress error output)
$ErrorActionPreferenceOld = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
git rev-parse --verify $BranchName 2>&1 | Out-Null
$branchExistsCode = $LASTEXITCODE
$ErrorActionPreference = $ErrorActionPreferenceOld

if ($branchExistsCode -eq 0) {
    Write-Warn "Branch $BranchName already exists locally. Checking it out..."
    git checkout $BranchName
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to checkout branch"
    }
} else {
    git checkout -b $BranchName
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to create branch"
    }
    Write-Success "Created branch: $BranchName"
}

# Add files
git add $MdxPath $ImagesDir
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Failed to add files"
}

# Add public directory if cover image was set
if ($CoverImage -ne "") {
    $PublicDir = Join-Path $RepoRoot "public\blog\$Slug"
    if (Test-Path $PublicDir) {
        git add $PublicDir
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "Could not add public directory"
        }
    }
}

Write-Success "Files staged"

# Commit
$CommitMsg = "feat(blog): add $Slug"
git commit -m $CommitMsg
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Failed to commit"
}
Write-Success "Committed: $CommitMsg"

# Push
git push -u origin $BranchName
if ($LASTEXITCODE -ne 0) {
    Write-Error-Custom "Failed to push branch"
}
Write-Success "Pushed to origin/$BranchName"

# Success message
Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "Success! Your blog post is ready." -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Post: $PostTitle"
Write-Host "Branch: $BranchName"
Write-Host "File: $MdxPath"
Write-Host ""
Write-Info "Create a PR manually when ready: gh pr create --base main"

# Return to main branch
Write-Host ""
Write-Info "Returning to main branch..."
git checkout main 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Could not checkout main"
}
git pull origin main 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Warn "Could not pull from main"
}
Write-Success "Returned to main branch"
