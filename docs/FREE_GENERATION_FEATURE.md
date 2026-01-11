# Free Generation Feature

## Overview

The Free Generation Feature provides a streamlined flow for non-paid users to generate and view AI-generated ads. This feature includes a new `/generating` page that guides users through the ad generation process, displays generated ads with brand insights, and provides download functionality with analytics tracking.

## Feature Flow

### 1. Initial Generation Request

**Entry Point**: User enters a website URL on the homepage (`url-input-section.tsx`)

**Flow**:
1. User enters a website URL
2. System checks if user is authenticated
   - If not authenticated: Redirects to `/sign-in?redirect=generate&website_url={url}`
   - If authenticated: Navigates to `/generating?website_url={url}`
3. The `/generating` page initiates the generation process

### 2. Generation Process

**Route**: `/generating`

**Components**:
- `CreatingProcess` - Displays animated progress steps during generation
- `ReadyAdsView` - Shows "Your ads are ready" screen after generation completes
- `GeneratedAdsDisplay` - Displays generated ads with brand insights

**Steps**:
1. **Loading State**: Shows `CreatingProcess` component with step animations:
   - Analyze website (10s)
   - Capture tone (12s)
   - Review social (15s)
   - Benchmark competitors (20s)
   - Craft CTA (60s)

2. **Completion**: When generation completes successfully:
   - URL is updated to include `job_id`: `/generating?job_id={job_id}`
   - `ReadyAdsView` component is displayed
   - User sees "Your ads are ready" screen with "See ads" button

3. **Viewing Ads**: When user clicks "See ads":
   - `GeneratedAdsDisplay` component is shown
   - Displays generated ads with brand insights

### 3. Returning to Completed Job

**Scenario**: User navigates directly to `/generating?job_id={job_id}` (e.g., from bookmark or shared link)

**Behavior**:
- Skips `ReadyAdsView` and `CreatingProcess`
- Directly fetches and displays ads using `GeneratedAdsDisplay`
- Shows brand insights and all generated ads

## Components

### CreatingProcess

**Location**: `app/(dashboard)/dashboard/ad-generation/creating-process.tsx`

**Purpose**: Displays animated progress steps during ad generation

**Props**:
- `stepTimings?: Partial<typeof STEP_TIMINGS>` - Optional custom step timings

**Features**:
- Animated step transitions
- Progress indicators for each generation step
- Customizable timing for each step

### ReadyAdsView

**Location**: `app/(dashboard)/dashboard/ad-generation/ready-ads-view.tsx`

**Purpose**: Displays completion screen after successful generation

**Props**:
- `onSeeAds?: () => void` - Callback when user clicks "See ads"
- `jobId?: string` - Optional job ID for reference

**Features**:
- "Your ads are ready" message
- "See ads" button to proceed to ad display
- Blumpo character image
- Test mode buttons (only in test environment)

### GeneratedAdsDisplay

**Location**: `app/(dashboard)/generating/generated-ads-display.tsx`

**Purpose**: Displays generated ads with brand insights and download functionality

**Props**:
- `images: AdImage[]` - Array of generated ad images
- `jobId: string` - Generation job ID
- `isPaidUser?: boolean` - Whether user has paid subscription

**Features**:

#### Left Panel - Generated Ads
- **Ad Grid**: Displays up to 6 generated ads
  - First 5 ads: Fully visible
  - 6th ad (if exists and user is free): Blurred with "?" overlay
  - For paid users: All ads are unblurred

- **Hover States**:
  - **Visible ads**: Show download button on hover
  - **Blurred ads**: Show download button with dark overlay; question mark fades out

- **Download Functionality**:
  - Click download button to download image
  - Loading state shows "Downloading..." with spinner
  - Analytics tracking for each download
  - Prevents duplicate downloads

#### Right Panel - Brand Insights

**Brand Components Section**:
- **Logo**: Displays brand logo (if available)
- **Colors**: Shows up to 4 brand colors in a 2x2 grid
- **Font**: Displays most popular font from brand analysis
- **Loading States**: Skeleton loaders while fetching brand data

**Customer Insights Section**:
- **Customer Pain Points**: Lists up to 5 pain points
- **Customer Groups**: Lists up to 5 target customer groups
- **Scrollable Content**: Fixed 180px height with vertical scroll

**Ad Types Section**:
- Lists available ad archetypes
- **Paid Badge**: Shows "Paid only" badge for free users
- **Coming Soon Dialog**: Clicking shows "Coming soon" popup

**Ad Formats Section**:
- **Different Ad Formats**: Shows available formats (1:1, 16:9)
- **Language**: Displays detected brand language
- **Paid Badge**: Shows "Paid only" badge for free users
- **Coming Soon Dialog**: Clicking shows "Coming soon" popup

**Actions**:
- **Generate More Ads**: Button to generate additional ads
- **Regenerate Ads** / **Login to Main Platform**:
  - Free users: "Regenerate ads" button
  - Paid users: "Login to main platform" button (navigates to `/dashboard`)

## API Endpoints

### POST `/api/generate`

**Purpose**: Initiates ad generation process

**Request Body**:
```json
{
  "url": "https://example.com"
}
```

**Response**:
```json
{
  "status": "SUCCEEDED",
  "job_id": "uuid",
  "images": [...]
}
```

**Error Codes**:
- `AUTH_REQUIRED`: User must be authenticated
- `INSUFFICIENT_TOKENS`: User doesn't have enough tokens
- `TIMEOUT`: Generation took too long

### GET `/api/generate/job-images?jobId={jobId}`

**Purpose**: Fetches images for a completed generation job

**Response**:
```json
[
  {
    "id": "uuid",
    "title": "Ad title",
    "publicUrl": "https://...",
    "width": 1024,
    "height": 1024,
    "format": "1:1",
    "archetype": {...},
    "createdAt": "2024-..."
  }
]
```

### GET `/api/generate/brand-data?job_id={jobId}`

**Purpose**: Fetches brand data and insights for a generation job

**Response**:
```json
{
  "brand": {
    "id": "uuid",
    "name": "Brand Name",
    "websiteUrl": "https://...",
    "language": "en",
    "fonts": [...],
    "colors": ["#FF0000", ...],
    "logoUrl": "https://..."
  },
  "insights": {
    "customerPainPoints": [...],
    "targetCustomers": [...],
    "customerGroups": [...],
    "redditCustomerPainPoints": [...],
    "redditCustomerDesires": [...]
  }
}
```

### POST `/api/ad-actions`

**Purpose**: Logs ad interaction events (downloads, saves, deletes)

**Request Body**:
```json
{
  "jobId": "uuid",
  "downloadedIds": ["uuid1", "uuid2"],
  "savedIds": [],
  "deletedIds": []
}
```

**Response**:
```json
{
  "success": true
}
```

## State Management

### Page State (`generating/page.tsx`)

- `status: JobStatus` - Current generation status
- `images: AdImage[]` - Generated ad images
- `error: string | null` - Error message if generation fails
- `isLoading: boolean` - Whether generation is in progress
- `actualJobId: string | null` - Job ID from API response
- `isPaidUser: boolean` - User subscription status
- `showReadyAds: boolean` - Whether to show ReadyAdsView
- `showGeneratedAds: boolean` - Whether to show GeneratedAdsDisplay

### Component State (`generated-ads-display.tsx`)

- `hoveredImageId: string | null` - Currently hovered image ID
- `brandData: BrandData | null` - Brand information
- `insights: BrandInsights | null` - Brand insights
- `isLoadingBrandData: boolean` - Whether brand data is loading
- `downloadedIds: Set<string>` - Set of downloaded image IDs
- `downloadingIds: Set<string>` - Set of images currently downloading
- `showComingSoonDialog: boolean` - Whether "Coming soon" dialog is open

## Paid vs Free User Differences

### Free Users
- 6th ad is blurred with "?" overlay
- "Paid only" badges on Ad Types and Ad Formats sections
- "Regenerate ads" button
- Cannot access paid features (shows "Coming soon" dialog)

### Paid Users
- All ads are unblurred
- No "Paid only" badges
- "Login to main platform" button (navigates to `/dashboard`)
- Full access to all features

## Analytics Tracking

All ad interactions are tracked via the `/api/ad-actions` endpoint:

- **Download Events**: Logged when user downloads an image
- **Event Type**: `downloaded`
- **Event Source**: `ui`
- **Metadata**: Includes `userId`, `jobId`, `adImageId`, `brandId`, `workflowId`

## Error Handling

### Generation Errors
- **AUTH_REQUIRED**: Redirects to sign-in page
- **INSUFFICIENT_TOKENS**: Shows error message
- **TIMEOUT**: Shows timeout error message
- **FAILED/CANCELED**: Shows error screen with option to go back

### Network Errors
- Download errors: Shows error in console, removes from downloading state
- Analytics errors: Logged but don't block download
- Brand data errors: Component handles missing data gracefully

## Styling

### CSS Modules
- `generated-ads-display.module.css` - Styles for GeneratedAdsDisplay component
- `creating-process.module.css` - Styles for CreatingProcess component
- `ready-ads-view.module.css` - Styles for ReadyAdsView component

### Key Styles
- Blurred overlay with question mark
- Hover overlays with gradient
- Download button with loading spinner
- Skeleton loaders for brand data
- Responsive grid layouts
- Scrollable insight containers

## Future Enhancements

Potential improvements for future iterations:

1. **Batch Downloads**: Allow downloading multiple ads at once
2. **Ad Preview**: Show larger preview on click
3. **Ad Sharing**: Share ads directly to social media
4. **Custom Filters**: Filter ads by format, archetype, etc.
5. **Ad Library**: Save favorite ads to personal library
6. **Upgrade Flow**: Direct upgrade path from "Coming soon" dialog
7. **Export Options**: Export ads in different formats/sizes
8. **Analytics Dashboard**: View download statistics and ad performance

## Related Documentation

- `docs/genartion_flow_logged_user.md` - Paid user generation flow
- `docs/ad_generation_flow.md` - Overall ad generation architecture
- `docs/brand_extraction_workflow.md` - Brand data extraction process
- `docs/TOKEN_SYSTEM.md` - Token system and billing

