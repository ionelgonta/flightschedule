import { BoardingPassData, PDFProcessingResult } from '../types/boarding-pass';

/**
 * Parser pentru boarding pass-uri - extrage datele din text sau PDF
 * Se ocupă DOAR de parsarea datelor, fără dependențe de UI
 */
export class BoardingPassParser {
  
  /**
   * Parsează text din PDF și extrage datele boarding pass-ului
   */
  static parseFromText(text: string): BoardingPassData | null {
    try {
      // Regex patterns pentru extragerea datelor
      const patterns = {
        passengerName: /(?:PASSENGER|NAME|MR|MS|MRS)\s+([A-Z\s]+?)(?:\s|$)/i,
        flightNumber: /(?:FLIGHT|FLT)\s*([A-Z]{2}\d{3,4})/i,
        route: /([A-Z]{3})\s*[-\/]\s*([A-Z]{3})/,
        date: /(\d{1,2}[A-Z]{3}\d{2,4})/i,
        confirmationCode: /(?:CONF|PNR|BOOKING)\s*:?\s*([A-Z0-9]{5,8})/i,
        seat: /(?:SEAT|SEQ)\s*:?\s*([A-Z0-9]{1,3})/i,
        gate: /(?:GATE|GT)\s*:?\s*([A-Z0-9]{1,3})/i,
        time: /(\d{1,2}:\d{2})/g
      };

      const result: Partial<BoardingPassData> = {};

      // Extrage numele pasagerului
      const nameMatch = text.match(patterns.passengerName);
      if (nameMatch) {
        result.passengerName = nameMatch[1].trim();
      }

      // Extrage numărul zborului
      const flightMatch = text.match(patterns.flightNumber);
      if (flightMatch) {
        const fullFlight = flightMatch[1];
        result.carrierCode = fullFlight.substring(0, 2);
        result.flightNumber = fullFlight.substring(2);
      }

      // Extrage ruta (origine și destinație)
      const routeMatch = text.match(patterns.route);
      if (routeMatch) {
        result.origin = routeMatch[1];
        result.destination = routeMatch[2];
      }

      // Extrage codul de confirmare
      const confMatch = text.match(patterns.confirmationCode);
      if (confMatch) {
        result.confirmationCode = confMatch[1];
      }

      // Extrage locul
      const seatMatch = text.match(patterns.seat);
      if (seatMatch) {
        result.seatNumber = seatMatch[1];
      }

      // Extrage poarta
      const gateMatch = text.match(patterns.gate);
      if (gateMatch) {
        result.gate = gateMatch[1];
      }

      // Validează că avem datele minime necesare
      if (result.passengerName && result.flightNumber && result.origin && result.destination) {
        return result as BoardingPassData;
      }

      return null;
    } catch (error) {
      console.error('Error parsing boarding pass text:', error);
      return null;
    }
  }

  /**
   * Parsează date din IATA BCBP (Bar Coded Boarding Pass)
   */
  static parseFromBCBP(bcbpData: string): BoardingPassData | null {
    try {
      if (!bcbpData || bcbpData.length < 60) {
        return null;
      }

      // IATA BCBP format parsing
      const result: Partial<BoardingPassData> = {};
      
      // Format: M1LASTNAME/FIRSTNAME EAIRLINEFLIGHTNUM ORIGDEST AIRLINE JULIANDATE COMPARTMENTCODE SEATNUM SEQUENCENUM CHECKDIGIT
      if (bcbpData.startsWith('M1')) {
        // Passenger name (positions 2-22)
        const nameSection = bcbpData.substring(2, 22).trim();
        const nameParts = nameSection.split('/');
        if (nameParts.length >= 2) {
          result.passengerName = `${nameParts[1]} ${nameParts[0]}`.trim();
        }

        // Operating carrier designator (position 23)
        result.carrierCode = bcbpData.substring(23, 24);

        // Flight number (positions 24-28)
        result.flightNumber = bcbpData.substring(24, 28).trim();

        // From city airport code (positions 29-31)
        result.origin = bcbpData.substring(29, 32);

        // To city airport code (positions 32-34)
        result.destination = bcbpData.substring(32, 35);

        // Marketing carrier (positions 35-37)
        const marketingCarrier = bcbpData.substring(35, 38);
        if (marketingCarrier.trim()) {
          result.carrierCode = marketingCarrier.trim();
        }

        // Seat number (positions 48-51)
        const seatNum = bcbpData.substring(48, 52).trim();
        if (seatNum) {
          result.seatNumber = seatNum;
        }

        // Store original BCBP data
        result.bcbpData = bcbpData;

        if (result.passengerName && result.flightNumber && result.origin && result.destination) {
          return result as BoardingPassData;
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing BCBP data:', error);
      return null;
    }
  }

  /**
   * Detectează și parsează din multiple formate
   */
  static parseFromMultipleFormats(text: string, bcbpData?: string): BoardingPassData | null {
    // Încearcă mai întâi BCBP dacă este disponibil
    if (bcbpData) {
      const bcbpResult = this.parseFromBCBP(bcbpData);
      if (bcbpResult) {
        return bcbpResult;
      }
    }

    // Încearcă parsarea din text
    const textResult = this.parseFromText(text);
    if (textResult) {
      // Adaugă BCBP data dacă este disponibilă
      if (bcbpData) {
        textResult.bcbpData = bcbpData;
      }
      return textResult;
    }

    return null;
  }

  /**
   * Validează datele boarding pass-ului
   */
  static validateBoardingPassData(data: BoardingPassData): boolean {
    const required = ['passengerName', 'flightNumber', 'origin', 'destination'];
    
    for (const field of required) {
      if (!data[field as keyof BoardingPassData]) {
        return false;
      }
    }

    // Validează codurile IATA (3 caractere)
    if (data.origin.length !== 3 || data.destination.length !== 3) {
      return false;
    }

    // Validează numele pasagerului (nu poate fi gol)
    if (data.passengerName.trim().length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Normalizează datele boarding pass-ului
   */
  static normalizeBoardingPassData(data: BoardingPassData): BoardingPassData {
    return {
      ...data,
      passengerName: data.passengerName.trim().toUpperCase(),
      flightNumber: data.flightNumber.replace(/[^0-9]/g, ''), // Doar cifre pentru Google Wallet
      carrierCode: data.carrierCode?.toUpperCase() || '',
      origin: data.origin.toUpperCase(),
      destination: data.destination.toUpperCase(),
      confirmationCode: data.confirmationCode?.toUpperCase() || '',
      seatNumber: data.seatNumber?.toUpperCase() || '',
      gate: data.gate?.toUpperCase() || ''
    };
  }
}