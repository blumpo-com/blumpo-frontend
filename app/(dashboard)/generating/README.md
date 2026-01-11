# Generating Feature

This folder contains the frontend components for the free ad generation flow.

## Files

### `page.tsx`

Main page component that orchestrates the generation flow.

**Route**: `/generating`

**Exports**:
- `GeneratingPage` (default) - Wrapped in Suspense for Next.js App Router compatibility

**Key Functions**:

#### `GeneratingPageContent()`
Main page component that manages the generation flow state.

**State**:
- `status: JobStatus` - Current generation job status
- `images: AdImage[]` - Generated ad images
- `error: string | null` - Error message if generation fails
- `isLoading: boolean` - Whether generation is in progress
- `actualJobId: string | null` - Job ID from API response
- `isPaidUser: boolean` - User subscription status
- `showReadyAds: boolean` - Whether to show ReadyAdsView
- `showGeneratedAds: boolean` - Whether to show GeneratedAdsDisplay

**Functions**:
- `fetchUserSubscription()` - Fetches user subscription status from `/api/user`
- `fetchImagesForJob()` - Fetches images for an existing job (when returning with job_id)
- `generateAds()` - Initiates ad generation via `/api/generate` and waits for completion
- `handleSeeAds()` - Callback when user clicks "See ads" in ReadyAdsView

**Flow**:
1. Checks if user has `job_id` in URL (returning to completed job)
   - If yes: Fetches images directly and shows `GeneratedAdsDisplay`
2. If `website_url` is present: Initiates generation
   - Shows `CreatingProcess` during generation
   - Shows `ReadyAdsView` on completion
   - Shows `GeneratedAdsDisplay` when user clicks "See ads"
3. Error handling for auth, insufficient tokens, timeouts

**Constants**:
- `STEP_TIMINGS` - Timing configuration for creation process steps

### `generated-ads-display.tsx`

Component that displays generated ads with brand insights and download functionality.

**Exports**:
- `GeneratedAdsDisplay` - Main component for displaying generated ads

**Props**:
```typescript
interface GeneratedAdsDisplayProps {
  images: AdImage[];      // Array of generated ad images
  jobId: string;          // Generation job ID
  isPaidUser?: boolean;   // Whether user has paid subscription (default: false)
}
```

**State**:
- `hoveredImageId: string | null` - Currently hovered image ID
- `brandData: BrandData | null` - Brand information (logo, colors, font, language)
- `insights: BrandInsights | null` - Brand insights (pain points, customer groups)
- `isLoadingBrandData: boolean` - Whether brand data is loading
- `downloadedIds: Set<string>` - Set of downloaded image IDs (for analytics)
- `downloadingIds: Set<string>` - Set of images currently downloading
- `showComingSoonDialog: boolean` - Whether "Coming soon" dialog is open

**Functions**:

#### `GeneratedAdsDisplay()`
Main component function.

#### `fetchBrandData()` (useEffect)
Fetches brand data and insights from `/api/generate/brand-data`.

#### `handleDownload(imageUrl: string, imageId: string)`
Downloads an image and logs the event to analytics.

**Flow**:
1. Prevents duplicate downloads
2. Sets downloading state
3. Fetches image blob
4. Creates download link and triggers download
5. Tracks download in state
6. Sends analytics event to `/api/ad-actions`
7. Clears downloading state

#### `handleGenerateMore()`
Placeholder for generating more ads (currently logs to console).

#### `handleRegenerate()`
Handles regenerate action:
- Paid users: Navigates to `/dashboard`
- Free users: Placeholder (logs to console)

#### `handlePaidSectionClick(sectionName: string)`
Shows "Coming soon" dialog when user clicks on paid-only sections.

**Features**:

**Left Panel - Generated Ads**:
- Displays up to 6 generated ads in a grid
- For free users: 6th ad is blurred with "?" overlay
- Hover states:
  - Visible ads: Show download button
  - Blurred ads: Show download button with dark overlay, question mark fades
- Download functionality with loading states

**Right Panel - Brand Insights**:

1. **Brand Components Section**:
   - Logo display (with skeleton loading)
   - Colors (up to 4 in 2x2 grid, with skeleton loading)
   - Font (most popular font from analysis, with skeleton loading)

2. **Customer Insights Section**:
   - Customer Pain Points (up to 5, with skeleton loading)
   - Customer Groups (up to 5, with skeleton loading)
   - Fixed 180px height with vertical scroll

3. **Ad Types Section**:
   - Lists available ad archetypes
   - Shows "Paid only" badge for free users
   - Click shows "Coming soon" dialog

4. **Ad Formats Section**:
   - Different Ad Formats (1:1, 16:9)
   - Language display (with flag emoji)
   - Shows "Paid only" badge for free users
   - Click shows "Coming soon" dialog

5. **Actions**:
   - "Generate more ads" button
   - "Regenerate ads" / "Login to main platform" button (based on subscription)

**Constants**:
- `archetypes` - Array of ad archetype definitions

### `generated-ads-display.module.css`

CSS module for styling the `GeneratedAdsDisplay` component.

**Key Styles**:
- `.container` - Main container layout
- `.leftPanel` - Left panel with generated ads
- `.rightPanel` - Right panel with insights
- `.imagesGrid` - Grid layout for ad images
- `.imageCard` - Individual ad card
- `.blurredCard` - Blurred card styles
- `.blurredOverlay` - Question mark overlay
- `.hoverOverlay` - Dark gradient overlay on hover
- `.downloadButton` - Download button styles
- `.downloadSpinner` - Loading spinner animation
- `.insightContent` - Scrollable insight containers
- `.skeleton*` - Skeleton loading styles
- `.paidBadge` - "Paid only" badge styles

## Dependencies

- `../dashboard/ad-generation/creating-process` - Loading animation component
- `../dashboard/ad-generation/ready-ads-view` - Completion screen component
- `@/components/ui/dialog` - Dialog component for "Coming soon" popup
- Next.js `useSearchParams`, `useRouter` - Navigation and URL params

## API Endpoints Used

- `POST /api/generate` - Initiate generation
- `GET /api/generate/job-images?jobId={id}` - Fetch images for a job
- `GET /api/generate/brand-data?job_id={id}` - Fetch brand data and insights
- `GET /api/user` - Fetch user subscription status
- `POST /api/ad-actions` - Log download events

## Related Documentation

- `docs/FREE_GENERATION_FEATURE.md` - Feature documentation
- `app/api/generate/README.md` - API routes documentation

