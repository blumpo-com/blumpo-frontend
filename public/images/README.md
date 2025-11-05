# Images Directory

This directory contains static images for the application.

## Structure

- `hero/` - Hero section images, landing page images
- `blog/` - Blog post images, thumbnails
- `avatars/` - User avatar images (if stored locally)

## Usage

Images in the `public/` directory are accessible at the root path:

```tsx
// Example usage in React components
<img src="/images/hero/hero-image.jpg" alt="Hero" />
```

## Best Practices

1. **Static images**: Use `public/images/` for images that don't change frequently
2. **Dynamic images**: For user-uploaded images, consider using:
   - Cloud storage (AWS S3, Cloudinary, etc.)
   - Database storage for metadata
   - CDN for better performance
3. **Optimization**: Use Next.js Image component for automatic optimization:
   ```tsx
   import Image from 'next/image';
   <Image src="/images/hero/hero.jpg" alt="Hero" width={800} height={600} />
   ```

## File Naming

- Use lowercase with hyphens: `hero-image.jpg`
- Keep names descriptive and meaningful
- Use appropriate extensions: `.jpg`, `.png`, `.webp`, `.svg`

