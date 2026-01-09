# Boarding Pass Module

## Descriere
Modul independent pentru procesarea boarding pass-urilor și integrarea cu Google Wallet.

## Structură
```
modules/boarding-pass/
├── core/                   # Logica de business
│   ├── BoardingPassParser.ts
│   ├── WalletJsonFactory.ts
│   └── WalletService.ts
├── components/             # Componente UI
│   ├── BarcodeScanner.tsx
│   ├── BoardingPassManager.tsx
│   └── PDFProcessor.tsx
├── api/                    # Endpoints API
│   ├── process.ts
│   └── google-wallet.ts
├── lib/                    # Utilitare
│   ├── barcode-detector.ts
│   ├── pdf-processor.ts
│   └── mlkit-scanner.ts
├── types/                  # Type definitions
│   └── boarding-pass.ts
└── config/                 # Configurări
    └── wallet-config.ts
```

## Utilizare
Modulul poate fi folosit independent sau integrat în aplicația principală.

## Dependențe
- Google ML Kit pentru scanarea codurilor de bare
- PDF.js pentru procesarea PDF-urilor
- Google Wallet API pentru generarea link-urilor