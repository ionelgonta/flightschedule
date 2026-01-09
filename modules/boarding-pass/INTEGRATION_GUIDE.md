# Boarding Pass Module - Integration Guide

## 🎯 Cum să integrezi modulul în aplicația ta

### 1. Instalare și Setup

```bash
# Copiază modulul în proiectul tău
cp -r modules/boarding-pass ./src/modules/

# Instalează dependențele
cd src/modules/boarding-pass
npm install
```

### 2. Configurare Environment Variables

```bash
# Copiază fișierul de configurare
cp .env.example .env.local

# Editează .env.local cu credențialele tale Google Wallet
```

### 3. Integrare în Next.js App

#### A. Folosește componenta completă

```tsx
import { BoardingPassProcessor } from '@/modules/boarding-pass';

export default function BoardingPassPage() {
  const handleSuccess = (data, walletLink) => {
    console.log('Boarding pass processed:', data);
    console.log('Wallet link:', walletLink);
  };

  const handleError = (error) => {
    console.error('Processing error:', error);
  };

  return (
    <div>
      <h1>Upload Boarding Pass</h1>
      <BoardingPassProcessor 
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  );
}
```

#### B. Folosește doar funcționalitatea core

```tsx
import { BoardingPassModule } from '@/modules/boarding-pass';

export default function CustomProcessor() {
  const handleFileUpload = async (file: File) => {
    try {
      const result = await BoardingPassModule.processFile(file);
      console.log('Result:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <input 
      type="file" 
      accept=".pdf"
      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
    />
  );
}
```

### 4. API Routes Integration

#### A. Copiază API routes în aplicația ta

```bash
# Pentru Next.js 13+ App Router
cp modules/boarding-pass/api/* ./app/api/boarding-pass/

# Pentru Next.js Pages Router
cp modules/boarding-pass/api/* ./pages/api/boarding-pass/
```

#### B. Sau folosește modulul direct în API routes

```typescript
// app/api/boarding-pass/process/route.ts
import { BoardingPassModule } from '@/modules/boarding-pass';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  try {
    const result = await BoardingPassModule.processFile(file);
    return Response.json({ success: true, data: result });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
}
```

### 5. Standalone Usage (fără Next.js)

```typescript
import { 
  PDFProcessor, 
  WalletService, 
  BoardingPassParser 
} from './modules/boarding-pass';

// Procesează un PDF
const pdfResult = await PDFProcessor.processPDF(file);

// Generează link Google Wallet
const walletResult = await WalletService.generateWalletLink(pdfResult.boardingPassData);

// Parsează text manual
const boardingPassData = BoardingPassParser.parseFromText(extractedText);
```

## 🔧 Configurare Avansată

### 1. Customizează configurația Google Wallet

```typescript
// config/custom-wallet-config.ts
import { GOOGLE_WALLET_CONFIG } from '@/modules/boarding-pass';

// Override configurația default
GOOGLE_WALLET_CONFIG.issuerId = 'your-custom-issuer-id';
GOOGLE_WALLET_CONFIG.issuerName = 'Your Company Name';
```

### 2. Extinde parsarea boarding pass-urilor

```typescript
import { BoardingPassParser } from '@/modules/boarding-pass';

// Adaugă parser custom pentru alte formate
class CustomBoardingPassParser extends BoardingPassParser {
  static parseFromCustomFormat(data: string) {
    // Logica ta custom
    return super.parseFromText(data);
  }
}
```

### 3. Customizează componenta UI

```tsx
import { BoardingPassProcessor } from '@/modules/boarding-pass';

// Wrapper cu styling custom
export function CustomBoardingPassProcessor() {
  return (
    <div className="my-custom-styles">
      <BoardingPassProcessor 
        className="custom-processor"
        onSuccess={(data, link) => {
          // Custom success handling
        }}
      />
    </div>
  );
}
```

## 🧪 Testing

### 1. Test configurația

```typescript
import { BoardingPassModule } from '@/modules/boarding-pass';

// Testează configurația Google Wallet
const configTest = await BoardingPassModule.testConfiguration();
console.log('Config test:', configTest);

// Verifică suportul browser-ului
const browserSupport = BoardingPassModule.checkBrowserSupport();
console.log('Browser support:', browserSupport);
```

### 2. Test cu date mock

```typescript
import { WalletService } from '@/modules/boarding-pass';

// Generează link de test
const testResult = await WalletService.generateTestLink();
console.log('Test link:', testResult.walletLink);
```

## 📦 Build și Deploy

### 1. Build modulul

```bash
cd modules/boarding-pass
npm run build
```

### 2. Include în build-ul principal

```json
// package.json
{
  "scripts": {
    "build": "npm run build:boarding-pass && next build",
    "build:boarding-pass": "cd modules/boarding-pass && npm run build"
  }
}
```

## 🚀 Production Checklist

- [ ] Environment variables configurate corect
- [ ] Google Wallet credentials valide
- [ ] PDF.js CDN disponibil
- [ ] Barcode detection suportat în browser
- [ ] API endpoints testate
- [ ] Error handling implementat
- [ ] Logging configurat
- [ ] Rate limiting implementat (dacă necesar)

## 🔍 Troubleshooting

### Problem: "Something went wrong" în Google Wallet
**Soluție**: Verifică că folosești configurația confirmată funcțională:
- Issuer ID: `3388000000023061835`
- Issuer Name: `"EMA PLUS SOLUTION SRL"`
- Flight number doar cu cifre
- Confirmation code obligatoriu

### Problem: PDF nu se procesează
**Soluție**: 
- Verifică că PDF.js se încarcă corect
- Testează cu un PDF simplu mai întâi
- Verifică console-ul pentru erori JavaScript

### Problem: Barcode detection nu funcționează
**Soluție**:
- Verifică că browser-ul suportă BarcodeDetector API
- Folosește Chrome/Edge pentru cel mai bun suport
- Testează cu imagini de calitate bună

## 📞 Support

Pentru probleme specifice modulului, verifică:
1. Console-ul browser-ului pentru erori JavaScript
2. Network tab pentru request-uri API eșuate
3. Configurația environment variables
4. Documentația Google Wallet API