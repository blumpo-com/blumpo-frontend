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

# Git operations
Write-Host ""
Write-Info "Git Operations"

$BranchName = "chore/blog/$Slug"

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

# Create PR
Write-Host ""
Write-Info "Creating Pull Request..."

try {
    $PrData = node $UtilsScript pr-summary $MdxPath | ConvertFrom-Json
    $PrTitle = $PrData.prTitle
    $PrBody = $PrData.prBody
    
    # Handle reviewers
    $ReviewersFlag = @()
    if ($env:GH_DEFAULT_REVIEWERS) {
        $ReviewersFlag = @("--reviewer", $env:GH_DEFAULT_REVIEWERS)
    }
    
    $PrUrl = gh pr create --title $PrTitle --body $PrBody --base main @ReviewersFlag 2>&1 | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Pull Request created!"
        Write-Host ""
        Write-Host "=======================================" -ForegroundColor Green
        Write-Host "Success! Your blog post is ready." -ForegroundColor Green
        Write-Host "=======================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Post: $PostTitle"
        Write-Host "PR: $PrUrl"
        Write-Host ""
        
        # Open PR in browser
        Start-Process $PrUrl
    } else {
        Write-Error-Custom "Failed to create PR: $PrUrl"
    }
} catch {
    Write-Error-Custom "Failed to create PR: $_"
}
