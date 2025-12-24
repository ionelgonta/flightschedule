# Flight Schedule - Real-Time Flight Information Platform

A modern, high-performance website that displays real-time flight schedules (arrivals and departures) from major airports worldwide. Built with Next.js 14, TypeScript, and TailwindCSS, optimized for SEO and monetization.

## 🚀 Features

### Core Functionality
- **Real-time flight data** - Live arrivals and departures from major airports
- **Advanced filtering** - Filter by airline, status, destination, time range
- **Instant search** - Search flights by number, airline, or destination
- **Responsive design** - Optimized for desktop, tablet, and mobile
- **Dark/Light mode** - User preference with system detection

### SEO Optimization
- **Advanced SEO** - Dynamic meta tags, structured data (Schema.org)
- **Performance optimized** - Lighthouse score 95+
- **Automatic sitemaps** - Dynamic sitemap generation
- **Canonical URLs** - Proper URL structure and canonicalization
- **Open Graph & Twitter Cards** - Social media optimization

### Monetization Ready
- **Google AdSense integration** - Pre-configured ad zones
- **Partner banner support** - Configurable custom banner zones
- **Performance optimized ads** - Lazy loading, non-blocking implementation
- **Responsive ad units** - Mobile and desktop optimized

### Technical Excellence
- **Next.js 14** - App Router, Server Components, ISR
- **TypeScript** - Full type safety
- **TailwindCSS** - Modern, responsive styling
- **Caching strategy** - Intelligent data caching with ISR
- **Error handling** - Comprehensive error boundaries and fallbacks

## 🏗️ Architecture

```
app/
├── layout.tsx              # Root layout with SEO and ads
├── page.tsx               # Homepage with featured airports
├── airport/[code]/        # Dynamic airport pages
│   ├── page.tsx          # Airport overview
│   ├── arrivals/page.tsx # Real-time arrivals
│   └── departures/page.tsx # Real-time departures
├── airports/page.tsx      # Airport directory
├── sitemap.ts            # Dynamic sitemap
└── robots.ts             # SEO robots.txt

components/
├── flights/              # Flight-related components
│   ├── FlightDisplay.tsx # Main flight display table
│   ├── FlightFilters.tsx # Advanced filtering
│   ├── FlightStatusBadge.tsx # Flight status indicators
│   └── LoadingSkeleton.tsx # Loading states
├── ads/                  # Advertising components
│   ├── AdBanner.tsx      # Reusable ad component
│   └── AdSenseScript.tsx # AdSense integration
├── Navbar.tsx            # Navigation with theme toggle
├── Footer.tsx            # Footer with links and ads
└── ThemeProvider.tsx     # Dark/light mode provider

lib/
├── airports.ts           # Airport data and utilities
├── airportsService.ts    # Flight data service with caching
└── adConfig.ts           # Advertising configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd flight-schedule
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Configure AdSense (Optional)**
   - Edit `components/ads/AdSenseScript.tsx`
   - Replace `ca-pub-XXXXXXXXXXXXXXXX` with your AdSense publisher ID
   - Update slot IDs in `lib/adConfig.ts`

4. **Run development server**
```bash
npm run dev
# or
yarn dev
```

5. **Open your browser**
   - Navigate to `http://localhost:3000`

## 📊 SEO Features

### Automatic SEO Generation
- **Dynamic meta tags** for each airport and page
- **Schema.org JSON-LD** structured data for airports and flights
- **Canonical URLs** for all pages
- **Open Graph** and **Twitter Cards** for social sharing
- **Automatic sitemap** generation with proper priorities
- **Robots.txt** with sitemap reference

### Content Strategy
- **SEO-optimized content** for each airport (400-800 words)
- **FAQ sections** with relevant questions
- **Breadcrumb navigation** for better UX and SEO
- **Internal linking** strategy between related pages

### Performance Optimization
- **Server-side rendering** for initial page load
- **Incremental Static Regeneration** for dynamic content
- **Image optimization** with Next.js Image component
- **Font optimization** with Google Fonts preloading
- **Lazy loading** for non-critical components

## 💰 Monetization Setup

### Google AdSense Integration

1. **Get AdSense approval**
   - Apply for Google AdSense account
   - Get your publisher ID (ca-pub-XXXXXXXXXXXXXXXX)

2. **Configure AdSense**
   ```typescript
   // components/ads/AdSenseScript.tsx
   const ADSENSE_PUBLISHER_ID = 'ca-pub-YOUR-PUBLISHER-ID'
   ```

3. **Set up ad units**
   ```typescript
   // lib/adConfig.ts
   export const adConfig = {
     publisherId: 'ca-pub-YOUR-PUBLISHER-ID',
     zones: {
       'header-banner': {
         active: true,
         slotId: 'YOUR-SLOT-ID',
         size: '728x90'
       }
       // ... more zones
     }
   }
   ```

### Partner Banner Integration

1. **Enable partner zones**
   ```typescript
   // lib/adConfig.ts
   'partner-banner-1': {
     active: true,
     customHtml: '<a href="https://partner.com"><img src="/banner.jpg" alt="Partner" /></a>'
   }
   ```

2. **Add banner images**
   - Place banner images in `public/` directory
   - Update HTML in ad configuration

## 🌐 Deployment

### Hetzner Cloud Deployment (Production)

Aplicația este deployată pe serverul Hetzner Cloud cu Docker și Nginx.

1. **Server Setup**
   - Server: Hetzner Cloud (23.88.113.154)
   - OS: Ubuntu 22.04
   - Docker + Docker Compose
   - Nginx cu SSL (Let's Encrypt)

2. **Deployment Process**
   ```bash
   # Conectare la server
   ssh root@23.88.113.154
   
   # Navigare la proiect
   cd /opt/anyway-flight-schedule
   
   # Pull ultimele modificări
   git pull origin main
   
   # Rebuild și restart
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **URLs de Acces**
   - **Production**: https://anyway.ro
   - **HTTP**: http://anyway.ro:8080
   - **HTTPS**: https://anyway.ro:8443

### Local Development

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

### Environment Configuration

Configurația pentru producție:

```typescript
// app/layout.tsx
metadataBase: new URL('https://anyway.ro'),

// app/sitemap.ts
const baseUrl = 'https://anyway.ro'
```

## 🔧 Configuration

### Adding New Airports

```typescript
// lib/airports.ts
export const MAJOR_AIRPORTS: Airport[] = [
  {
    code: 'ABC',
    name: 'New Airport Name',
    city: 'City Name',
    country: 'Country',
    timezone: 'Timezone/Location'
  },
  // ... existing airports
]
```

### Customizing Ad Zones

```typescript
// lib/adConfig.ts
export const adConfig = {
  zones: {
    'new-zone': {
      active: true,
      slotId: 'your-slot-id',
      size: '300x250',
      customHtml: undefined // or custom HTML
    }
  }
}
```

### Theme Customization

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        // Customize primary colors
        500: '#your-color',
        600: '#your-darker-color',
      }
    }
  }
}
```

## 📈 Performance Optimization

### Built-in Optimizations
- **ISR caching** - 5-minute cache for flight data
- **Image optimization** - WebP/AVIF with Next.js Image
- **Font optimization** - Google Fonts with preloading
- **Bundle optimization** - Tree shaking and code splitting
- **Compression** - Brotli and gzip compression

### Monitoring
- Docker logs pentru monitoring aplicație
- Google PageSpeed Insights pentru SEO scoring
- Google Search Console pentru search performance
- Nginx logs pentru traffic analysis

## 🔮 Future Enhancements

### Planned Features
- **Individual flight tracking** - `/flight/[flightNumber]` pages
- **Push notifications** - Flight status alerts
- **Interactive maps** - Live flight tracking with maps
- **Multi-language support** - Internationalization
- **API integration** - Real flight data APIs (AirLabs, AviationStack)
- **User accounts** - Saved flights and preferences

### Scalability
- **Database integration** - PostgreSQL/MongoDB for flight data
- **Redis caching** - Advanced caching strategy
- **CDN integration** - Global content delivery
- **Load balancing** - High-traffic handling

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments for implementation details

---

**Built with ❤️ using Next.js, TypeScript, and TailwindCSS**