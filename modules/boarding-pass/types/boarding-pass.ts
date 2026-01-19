// Type definitions pentru modulul boarding pass

export interface BoardingPassData {
  passengerName: string;
  flightNumber: string;
  carrierCode: string;
  airlineName: string;
  origin: string;
  destination: string;
  departureTime: string;
  confirmationCode: string;
  bcbpData?: string;
  seatNumber?: string;
  gate?: string;
  boardingTime?: string;
}

export interface BarcodeDetectionResult {
  success: boolean;
  data?: string;
  format?: 'QR_CODE' | 'PDF417' | 'CODE128';
  error?: string;
}

export interface PDFProcessingResult {
  success: boolean;
  text?: string;
  boardingPassData?: BoardingPassData;
  barcodeData?: BarcodeDetectionResult;
  error?: string;
}

export interface GoogleWalletConfig {
  issuerId: string;
  issuerName: string;
  serviceAccountEmail: string;
  privateKey: string;
  projectId: string;
}

export interface WalletLinkResult {
  success: boolean;
  walletLink?: string;
  error?: string;
  debugInfo?: any;
}

export interface FlightClass {
  id: string;
  issuerName: string;
  reviewStatus: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  transitType: 'AIR';
  flightHeader: {
    carrier: {
      carrierIataCode: string;
      airlineName: {
        defaultValue: {
          language: string;
          value: string;
        };
      };
    };
    flightNumber: string;
  };
  origin: {
    airportIataCode: string;
  };
  destination: {
    airportIataCode: string;
  };
  localScheduledDepartureDateTime: string;
  boardingAndSeatingPolicy?: {
    boardingPolicy?: 'ZONE_BASED' | 'GROUP_BASED' | 'BOARDING_POLICY_UNSPECIFIED';
    seatClassPolicy?: 'CABIN_BASED' | 'CLASS_BASED' | 'TIER_BASED' | 'SEAT_CLASS_POLICY_UNSPECIFIED';
  };
}

export interface FlightObject {
  id: string;
  classId: string;
  state: 'ACTIVE' | 'INACTIVE';
  passengerName: string;
  reservationInfo: {
    confirmationCode: string;
  };
  flightNumber: string;
  barcode?: {
    type: 'QR_CODE' | 'PDF417';
    value: string;
  };
  boardingAndSeatingInfo?: {
    seatNumber?: string;
    boardingGroup?: string;
    boardingPosition?: string;
    sequenceNumber?: string;
    boardingDoor?: string;
    seatClass?: string;
  };
}

export interface GoogleWalletPayload {
  flightClasses: FlightClass[];
  flightObjects: FlightObject[];
}