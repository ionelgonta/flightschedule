import { GoogleWalletConfig } from '../types/boarding-pass';

// Configurația Google Wallet - FORMULA DE SUCCES CONFIRMATĂ
// IMPORTANT: Set environment variables in .env.local:
// - GOOGLE_WALLET_PRIVATE_KEY
// - GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL
// - GOOGLE_WALLET_ISSUER_ID
export const GOOGLE_WALLET_CONFIG: GoogleWalletConfig = {
  // ISSUER ID REAL - FUNCȚIONEAZĂ 100%
  issuerId: process.env.GOOGLE_WALLET_ISSUER_ID || '3388000000023061835',
  
  // ISSUER NAME REAL - NUMELE EXACT DIN GOOGLE PAY CONSOLE
  issuerName: process.env.GOOGLE_WALLET_ISSUER_NAME || 'EMA PLUS SOLUTION SRL',
  
  // SERVICE ACCOUNT FUNCȚIONAL
  serviceAccountEmail: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL || '',
  
  // PROJECT ID
  projectId: process.env.GOOGLE_WALLET_PROJECT_ID || 'wallet-boarding-pass-483409',
  
  // PRIVATE KEY - MUST be set via environment variable
  privateKey: (process.env.GOOGLE_WALLET_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

// Validare configurație
export function validateWalletConfig(): boolean {
  return !!(
    GOOGLE_WALLET_CONFIG.issuerId &&
    GOOGLE_WALLET_CONFIG.issuerName &&
    GOOGLE_WALLET_CONFIG.serviceAccountEmail &&
    GOOGLE_WALLET_CONFIG.privateKey
  );
}

// Scopes necesare pentru Google Wallet API
export const WALLET_SCOPES = [
  'https://www.googleapis.com/auth/wallet_object.issuer'
];

// Endpoints API
export const WALLET_ENDPOINTS = {
  ISSUER_LIST: 'https://walletobjects.googleapis.com/walletobjects/v1/issuer',
  FLIGHT_CLASS: 'https://walletobjects.googleapis.com/walletobjects/v1/flightClass',
  FLIGHT_OBJECT: 'https://walletobjects.googleapis.com/walletobjects/v1/flightObject',
  SAVE_TO_WALLET: 'https://pay.google.com/gp/v/save/'
};

// Configurări pentru JWT
export const JWT_CONFIG = {
  algorithm: 'RS256' as const,
  audience: 'google',
  type: 'savetowallet',
  expirationTime: 3600 // 1 oră
};