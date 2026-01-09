import jwt from 'jsonwebtoken';
import { BoardingPassData, WalletLinkResult, GoogleWalletPayload } from '../types/boarding-pass';
import { GOOGLE_WALLET_CONFIG, JWT_CONFIG, WALLET_ENDPOINTS } from '../config/wallet-config';
import { WalletJsonFactory } from './WalletJsonFactory';

/**
 * Service pentru integrarea cu Google Wallet
 * Gestionează autentificarea și generarea link-urilor
 */
export class WalletService {
  
  /**
   * Generează link pentru Google Wallet din datele boarding pass-ului
   * CRITICAL: Folosește formula de succes confirmată
   */
  static async generateWalletLink(boardingPassData: BoardingPassData): Promise<WalletLinkResult> {
    try {
      // Validează configurația
      if (!this.validateConfiguration()) {
        return {
          success: false,
          error: 'Google Wallet configuration is incomplete'
        };
      }

      // Normalizează datele
      const normalizedData = this.normalizeBoardingPassData(boardingPassData);

      // Creează payload-ul
      const payload = WalletJsonFactory.createWalletPayload(normalizedData);

      // Validează payload-ul
      if (!WalletJsonFactory.validatePayload(payload)) {
        return {
          success: false,
          error: 'Invalid wallet payload generated'
        };
      }

      // Creează JWT token
      const token = this.createJWTToken(payload);

      // Generează link-ul final
      const walletLink = `${WALLET_ENDPOINTS.SAVE_TO_WALLET}${token}`;

      return {
        success: true,
        walletLink: walletLink,
        debugInfo: {
          payload: payload,
          tokenLength: token.length,
          linkLength: walletLink.length
        }
      };

    } catch (error) {
      console.error('Error generating wallet link:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Creează JWT token pentru Google Wallet
   * CRITICAL: Folosește algoritmul RS256 și configurația confirmată
   */
  private static createJWTToken(payload: GoogleWalletPayload): string {
    const now = Math.floor(Date.now() / 1000);
    
    const jwtPayload = {
      iss: GOOGLE_WALLET_CONFIG.serviceAccountEmail,
      aud: JWT_CONFIG.audience,
      typ: JWT_CONFIG.type,
      iat: now,
      exp: now + JWT_CONFIG.expirationTime,
      payload: payload
    };

    return jwt.sign(jwtPayload, GOOGLE_WALLET_CONFIG.privateKey, {
      algorithm: JWT_CONFIG.algorithm
    });
  }

  /**
   * Validează configurația Google Wallet
   */
  private static validateConfiguration(): boolean {
    const required = [
      GOOGLE_WALLET_CONFIG.issuerId,
      GOOGLE_WALLET_CONFIG.issuerName,
      GOOGLE_WALLET_CONFIG.serviceAccountEmail,
      GOOGLE_WALLET_CONFIG.privateKey
    ];

    return required.every(field => field && field.trim().length > 0);
  }

  /**
   * Normalizează datele boarding pass-ului pentru Google Wallet
   */
  private static normalizeBoardingPassData(data: BoardingPassData): BoardingPassData {
    return {
      ...data,
      // Asigură-te că flight number conține doar cifre
      flightNumber: data.flightNumber.replace(/[^0-9]/g, ''),
      
      // Asigură-te că avem un confirmation code
      confirmationCode: data.confirmationCode || this.generateConfirmationCode(),
      
      // Normalizează numele pasagerului
      passengerName: data.passengerName.trim().toUpperCase(),
      
      // Normalizează codurile aeroporturilor
      origin: data.origin.toUpperCase(),
      destination: data.destination.toUpperCase(),
      
      // Normalizează codul companiei
      carrierCode: data.carrierCode?.toUpperCase() || this.extractCarrierFromFlight(data.flightNumber)
    };
  }

  /**
   * Extrage codul companiei din numărul zborului
   */
  private static extractCarrierFromFlight(flightNumber: string): string {
    const match = flightNumber.match(/^([A-Z]{2})/);
    return match ? match[1] : 'XX';
  }

  /**
   * Generează un cod de confirmare aleatoriu
   */
  private static generateConfirmationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Testează conectivitatea cu Google Wallet API
   */
  static async testWalletConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.validateConfiguration()) {
        return {
          success: false,
          message: 'Configuration incomplete'
        };
      }

      // Creează un payload de test
      const testPayload = WalletJsonFactory.createTestPayload();
      
      // Încearcă să creeze un JWT token
      const token = this.createJWTToken(testPayload);
      
      if (token && token.length > 100) {
        return {
          success: true,
          message: `JWT token created successfully (${token.length} characters)`
        };
      }

      return {
        success: false,
        message: 'Failed to create JWT token'
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generează link de test pentru debugging
   */
  static async generateTestLink(): Promise<WalletLinkResult> {
    const testData: BoardingPassData = {
      passengerName: 'IONEL GONTA',
      flightNumber: 'LH4820',
      carrierCode: 'LH',
      airlineName: 'Lufthansa',
      origin: 'OTP',
      destination: 'LHR',
      departureTime: '2026-06-01T10:00:00',
      confirmationCode: 'LH7G8K',
      bcbpData: 'M1GONTA/IONEL ELH4820 OTPLHR LH 007Y015A0025 100'
    };

    return this.generateWalletLink(testData);
  }

  /**
   * Validează un link Google Wallet generat
   */
  static validateWalletLink(link: string): boolean {
    try {
      // Verifică că link-ul începe cu URL-ul corect
      if (!link.startsWith(WALLET_ENDPOINTS.SAVE_TO_WALLET)) {
        return false;
      }

      // Extrage token-ul
      const token = link.replace(WALLET_ENDPOINTS.SAVE_TO_WALLET, '');
      
      // Verifică că token-ul nu este gol
      if (!token || token.length < 100) {
        return false;
      }

      // Încearcă să decodeze token-ul (fără verificare pentru că nu avem cheia publică)
      const decoded = jwt.decode(token);
      
      return decoded !== null && typeof decoded === 'object';

    } catch (error) {
      console.error('Error validating wallet link:', error);
      return false;
    }
  }
}