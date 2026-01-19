import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'boarding-passes');

// Known carriers for airline name lookup
const KNOWN_CARRIERS: Record<string, string> = {
  '5F': 'FlyOne', 'RO': 'TAROM', 'W4': 'Wizz Air', 'W6': 'Wizz Air', 'WZ': 'Wizz Air',
  'H4': 'HiSky', '0B': 'Blue Air', '9U': 'Air Moldova',
  'LH': 'Lufthansa', 'FR': 'Ryanair', 'BA': 'British Airways', 'KL': 'KLM', 'AF': 'Air France',
  'U2': 'easyJet', 'EI': 'Aer Lingus', 'TK': 'Turkish Airlines', 'EK': 'Emirates',
};

interface BoardingPassData {
  passengerName: string;
  carrierCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  flightDate: string | null;
}

function getBoardingPassData(id: string): BoardingPassData | null {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const data = getBoardingPassData(params.id);
  
  if (!data) {
    return {
      title: 'Boarding Pass | Anyway.ro',
      description: 'Boarding pass digital pentru zborul tău',
    };
  }

  const airlineName = KNOWN_CARRIERS[data.carrierCode] || data.carrierCode;
  const flightInfo = `${data.carrierCode}${data.flightNumber}`;
  const route = `${data.origin} → ${data.destination}`;
  
  const title = `Boarding Pass - ${data.passengerName}`;
  const description = `Boarding pass digital pentru zborul ${flightInfo} (${route}) - ${airlineName}`;

  return {
    title,
    description,
    openGraph: {
      title: `Boarding Pass - ${data.passengerName}`,
      description: `✈️ ${flightInfo} • ${route} • ${airlineName}`,
      type: 'website',
      siteName: 'Anyway.ro',
      locale: 'ro_RO',
    },
    twitter: {
      card: 'summary',
      title: `Boarding Pass - ${data.passengerName}`,
      description: `✈️ ${flightInfo} • ${route} • ${airlineName}`,
    },
  };
}

export default function BoardingPassLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
