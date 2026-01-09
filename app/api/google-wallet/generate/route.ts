import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Google Wallet Success Formula - NEVER CHANGE THESE VALUES
const ISSUER_ID = '3388000000023061835';
const ISSUER_NAME = 'EMA PLUS SOLUTION SRL';

// Service account credentials from environment variables
// IMPORTANT: Set GOOGLE_WALLET_CLIENT_EMAIL and GOOGLE_WALLET_PRIVATE_KEY in .env.local
const serviceAccount = {
  client_email: process.env.GOOGLE_WALLET_CLIENT_EMAIL || '',
  private_key: (process.env.GOOGLE_WALLET_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

// Known carriers for airline name lookup
const KNOWN_CARRIERS: Record<string, string> = {
  '5F': 'FlyOne', 'RO': 'TAROM', 'W4': 'Wizz Air', 'W6': 'Wizz Air', 'WZ': 'Wizz Air',
  'H4': 'HiSky', '0B': 'Blue Air', '9U': 'Air Moldova',
  'LH': 'Lufthansa', 'FR': 'Ryanair', 'BA': 'British Airways', 'KL': 'KLM', 'AF': 'Air France',
  'LX': 'Swiss', 'OS': 'Austrian', 'AZ': 'ITA Airways', 'IB': 'Iberia', 'VY': 'Vueling',
  'U2': 'easyJet', 'EW': 'Eurowings', 'EI': 'Aer Lingus', 'SK': 'SAS', 'AY': 'Finnair',
  'SN': 'Brussels Airlines', 'TP': 'TAP Portugal', 'TK': 'Turkish Airlines', 'EK': 'Emirates',
  'QR': 'Qatar Airways', 'AA': 'American Airlines', 'DL': 'Delta', 'UA': 'United',
  'PC': 'Pegasus', 'A3': 'Aegean', 'JU': 'Air Serbia', 'OU': 'Croatia Airlines',
  'LO': 'LOT Polish', 'OK': 'Czech Airlines', 'BT': 'airBaltic',
  'QS': 'SmartWings', 'V7': 'Volotea', 'XR': 'Corendon', 'DE': 'Condor', 'XQ': 'SunExpress'
};

interface BoardingPassRequest {
  passengerName: string;
  flightNumber: string;
  carrierCode: string;
  origin: string;
  destination: string;
  seatNumber?: string;
  compartment?: string;
  confirmationCode?: string;
  flightDate?: string;
  raw?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BoardingPassRequest = await request.json();

    // Validate required fields
    if (!body.passengerName || !body.flightNumber || !body.carrierCode || !body.origin || !body.destination) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: passengerName, flightNumber, carrierCode, origin, destination' },
        { status: 400 }
      );
    }

    // Generate unique IDs
    const timestamp = Date.now();
    const now = Math.floor(timestamp / 1000);

    // Get airline name
    const airlineName = KNOWN_CARRIERS[body.carrierCode] || body.carrierCode;

    // Ensure confirmation code exists
    const confirmationCode = body.confirmationCode || 'XXXXXX';

    // Use provided date or default
    let departureDate = body.flightDate;
    if (!departureDate) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      departureDate = futureDate.toISOString().split('T')[0];
    }

    // Create JWT payload using CONFIRMED WORKING FORMULA
    const payload = {
      iss: serviceAccount.client_email,
      aud: "google",
      typ: "savetowallet",
      iat: now,
      exp: now + 3600,
      payload: {
        flightClasses: [{
          id: `${ISSUER_ID}.CLASS_${timestamp}`,
          issuerName: ISSUER_NAME,
          reviewStatus: "UNDER_REVIEW",
          transitType: "AIR",
          flightHeader: {
            carrier: {
              carrierIataCode: body.carrierCode,
              airlineName: { defaultValue: { language: "en-US", value: airlineName } }
            },
            flightNumber: body.flightNumber
          },
          origin: { airportIataCode: body.origin, terminal: "1" },
          destination: { airportIataCode: body.destination, terminal: "1" },
          localScheduledDepartureDateTime: `${departureDate}T10:00:00`,
          localScheduledArrivalDateTime: `${departureDate}T12:30:00`
        }],
        flightObjects: [{
          id: `${ISSUER_ID}.OBJ_${timestamp}`,
          classId: `${ISSUER_ID}.CLASS_${timestamp}`,
          state: "ACTIVE",
          passengerName: body.passengerName,
          reservationInfo: { confirmationCode: confirmationCode },
          flightNumber: body.flightNumber,
          seatInfo: body.seatNumber ? { seatNumber: body.seatNumber, seatClass: body.compartment || "Y" } : undefined,
          barcode: { type: "QR_CODE", value: body.raw || "", alternateText: `${body.carrierCode}${body.flightNumber}` }
        }]
      }
    };

    // Sign JWT with RS256
    const token = jwt.sign(payload, serviceAccount.private_key, { algorithm: 'RS256' });
    
    // Generate Google Wallet link
    const walletLink = `https://pay.google.com/gp/v/save/${token}`;

    console.log('Google Wallet link regenerated:', {
      passenger: body.passengerName,
      flight: `${body.carrierCode}${body.flightNumber}`,
      route: `${body.origin}-${body.destination}`,
      date: departureDate,
      linkLength: walletLink.length
    });

    return NextResponse.json({
      success: true,
      walletLink,
      flightInfo: {
        passenger: body.passengerName,
        flight: `${body.carrierCode}${body.flightNumber}`,
        route: `${body.origin} → ${body.destination}`,
        date: departureDate,
        confirmationCode
      }
    });

  } catch (error) {
    console.error('Google Wallet generation error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate Google Wallet link',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to get airport name from IATA code
function getAirportName(airportCode: string): string {
  const airports: Record<string, string> = {
    'OTP': 'Henri Coandă International Airport',
    'BBU': 'Aurel Vlaicu International Airport',
    'CLJ': 'Cluj-Napoca International Airport',
    'TSR': 'Timișoara Traian Vuia International Airport',
    'IAS': 'Iași International Airport',
    'CND': 'Constanța Mihail Kogălniceanu International Airport',
    'SBZ': 'Sibiu International Airport',
    'CRA': 'Craiova Airport',
    'BCM': 'Bacău Airport',
    'BAY': 'Oradea Airport',
    'OMR': 'Oradea Airport',
    'SCV': 'Suceava Airport',
    'TGM': 'Târgu Mureș Airport',
    'ARW': 'Arad Airport',
    'SUJ': 'Satu Mare Airport',
    'GHV': 'Brașov Airport',
    'RMO': 'Chișinău International Airport',
    'LHR': 'London Heathrow Airport',
    'LTN': 'London Luton Airport',
    'STN': 'London Stansted Airport',
    'LGW': 'London Gatwick Airport',
    'CDG': 'Charles de Gaulle Airport',
    'FRA': 'Frankfurt Airport',
    'AMS': 'Amsterdam Airport Schiphol',
    'FCO': 'Leonardo da Vinci International Airport',
    'MUC': 'Munich Airport',
    'VIE': 'Vienna International Airport'
  };

  return airports[airportCode] || `${airportCode} Airport`;
}