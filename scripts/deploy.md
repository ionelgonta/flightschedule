# Deployment Instructions

## Quick Deploy to Vercel

### 1. Prerequisites
- Node.js 18+ installed
- Vercel account (free tier available)
- Git repository

### 2. Install Vercel CLI
```bash
npm i -g vercel
```

### 3. Deploy
```bash
# From project root
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: flight-schedule (or your preferred name)
# - Directory: ./
# - Override settings? No
```

### 4. Production Deployment
```bash
vercel --prod
```

### 5. Custom Domain (Optional)
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Domains
4. Add your custom domain
5. Update the following files with your domain:

```typescript
// app/layout.tsx
metadataBase: new URL('https://your-domain.com'),

// app/sitemap.ts
const baseUrl = 'https://your-domain.com'
```

## Manual Deployment

### 1. Build the project
```bash
npm run build
```

### 2. Test production build locally
```bash
npm start
```

### 3. Deploy to your hosting provider
- Upload the `.next` folder and other necessary files
- Set Node.js version to 18+
- Set build command: `npm run build`
- Set start command: `npm start`

## Environment Variables

For production, you may want to set:

```bash
# Vercel Dashboard > Settings > Environment Variables
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Post-Deployment Checklist

### 1. SEO Setup
- [ ] Submit sitemap to Google Search Console
- [ ] Verify robots.txt is accessible
- [ ] Check meta tags with Facebook Debugger
- [ ] Test structured data with Google Rich Results Test

### 2. Performance
- [ ] Run Lighthouse audit (aim for 95+ score)
- [ ] Test on mobile devices
- [ ] Verify Core Web Vitals

### 3. AdSense Setup (if using)
- [ ] Replace placeholder publisher ID
- [ ] Create ad units in AdSense dashboard
- [ ] Update slot IDs in `lib/adConfig.ts`
- [ ] Test ad display

### 4. Monitoring
- [ ] Set up Vercel Analytics
- [ ] Configure Google Analytics (optional)
- [ ] Set up error monitoring (Sentry, etc.)

## Troubleshooting

### Build Errors
- Check Node.js version (18+)
- Clear `.next` folder and rebuild
- Check for TypeScript errors

### Performance Issues
- Enable compression in hosting provider
- Verify image optimization is working
- Check bundle size with `npm run build`

### SEO Issues
- Verify meta tags are rendering
- Check sitemap accessibility
- Ensure canonical URLs are correct

## Scaling Considerations

For high traffic:
- Enable Vercel Pro for better performance
- Consider CDN for static assets
- Implement Redis caching for flight data
- Add database for persistent storage