const fs = require("fs");
const path = require("path");

const IATA_TO_CITY = {
  "OTP": "București", "CLJ": "Cluj-Napoca", "TSR": "Timișoara", "IAS": "Iași",
  "CND": "Constanța", "SBZ": "Sibiu", "CRA": "Craiova", "BCM": "Bacău",
  "OMR": "Oradea", "SCV": "Suceava", "TGM": "Târgu Mureș", "ARW": "Arad",
  "SUJ": "Satu Mare", "GHV": "Brașov", "RMO": "Chișinău", "BBU": "București",
  "IST": "Istanbul", "SAW": "Istanbul", "VIE": "Viena", "FRA": "Frankfurt",
  "MUC": "Munchen", "LHR": "Londra", "LTN": "Londra", "STN": "Londra",
  "CDG": "Paris", "ORY": "Paris", "BVA": "Paris", "FCO": "Roma", "MXP": "Milano",
  "BGY": "Milano", "BCN": "Barcelona", "MAD": "Madrid", "AMS": "Amsterdam",
  "BRU": "Bruxelles", "ATH": "Atena", "TLV": "Tel Aviv", "DXB": "Dubai",
  "DOH": "Doha", "LCA": "Larnaca", "BUD": "Budapesta", "PRG": "Praga",
  "WAW": "Varșovia", "WMI": "Varșovia", "BER": "Berlin", "DUS": "Dusseldorf", 
  "HAM": "Hamburg", "CGN": "Koln", "STR": "Stuttgart", "NUE": "Nurnberg", 
  "FMM": "Memmingen", "EIN": "Eindhoven", "CRL": "Charleroi", "HRG": "Hurghada", 
  "SSH": "Sharm", "AYT": "Antalya", "DLM": "Dalaman", "BJV": "Bodrum", 
  "NCE": "Nisa", "LYS": "Lyon", "TLS": "Toulouse", "NAP": "Napoli", 
  "BLQ": "Bologna", "VCE": "Veneția", "PSA": "Pisa", "FLR": "Florența", 
  "BRI": "Bari", "CTA": "Catania", "PMO": "Palermo", "AGP": "Malaga", 
  "ALC": "Alicante", "VLC": "Valencia", "PMI": "Palma", "IBZ": "Ibiza", 
  "TFS": "Tenerife", "LPA": "Gran Canaria", "DUB": "Dublin", "EDI": "Edinburgh", 
  "MAN": "Manchester", "BHX": "Birmingham", "GLA": "Glasgow", "BRS": "Bristol", 
  "LPL": "Liverpool", "CPH": "Copenhaga", "ARN": "Stockholm", "OSL": "Oslo", 
  "HEL": "Helsinki", "RIX": "Riga", "VNO": "Vilnius", "TLL": "Tallinn", 
  "SOF": "Sofia", "BEG": "Belgrad", "ZAG": "Zagreb", "LJU": "Ljubljana", 
  "SKP": "Skopje", "TIA": "Tirana", "SJJ": "Sarajevo", "KIV": "Chișinău", 
  "EVN": "Erevan", "TBS": "Tbilisi", "GYD": "Baku", "AMM": "Amman", 
  "BEY": "Beirut", "CAI": "Cairo", "WRO": "Wroclaw", "KRK": "Cracovia", 
  "GDN": "Gdansk", "POZ": "Poznan", "KTW": "Katowice", "LUX": "Luxemburg", 
  "GVA": "Geneva", "ZRH": "Zurich", "BSL": "Basel", "SZG": "Salzburg", 
  "INN": "Innsbruck", "VRN": "Verona", "TRN": "Torino", "GOA": "Genova", 
  "TSF": "Treviso", "SUF": "Lamezia", "BDS": "Brindisi", "PSR": "Pescara",
  "TKU": "Turku", "BLL": "Billund", "LGW": "Londra", "SKG": "Salonic",
  "HER": "Heraklion", "RHO": "Rhodos", "CFU": "Corfu", "ZTH": "Zakynthos",
  "JMK": "Mykonos", "JTR": "Santorini", "CHQ": "Chania", "KGS": "Kos",
  "PFO": "Paphos", "ESB": "Ankara", "ADB": "Izmir", "GZT": "Gaziantep",
  "AUH": "Abu Dhabi", "SHJ": "Sharjah", "KWI": "Kuwait", "BAH": "Bahrain",
  "MCT": "Muscat", "RUH": "Riyadh", "JED": "Jeddah", "DMM": "Dammam",
  "LIS": "Lisabona", "OPO": "Porto", "FAO": "Faro", "SVQ": "Sevilla",
  "BIO": "Bilbao", "SDR": "Santander", "SCQ": "Santiago", "XRY": "Jerez",
  "REU": "Reus", "GRO": "Girona", "LEI": "Almeria", "MJV": "Murcia"
};

const getCityName = (code) => IATA_TO_CITY[code] || code;
const dayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

const backupsDir = "./data/daily_backups";
const dirs = fs.readdirSync(backupsDir).filter(d => d.startsWith("daily_backup_"));
const flightsByRoute = new Map();

console.log("Processing " + dirs.length + " backup directories...");

dirs.forEach((dir, idx) => {
  const dirPath = path.join(backupsDir, dir);
  try {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith(".json"));
    files.forEach(file => {
      try {
        const content = fs.readFileSync(path.join(dirPath, file), "utf8");
        const data = JSON.parse(content);
        const flights = Array.isArray(data) ? data : Object.values(data);
        
        flights.forEach(flight => {
          if (!flight.flightNumber || !flight.scheduledTime) return;
          const origin = flight.originCode || flight.originAirport || "";
          const dest = flight.destinationCode || flight.destinationAirport || "";
          if (!origin || !dest) return;
          
          const key = flight.flightNumber + "_" + origin + "_" + dest;
          if (!flightsByRoute.has(key)) {
            flightsByRoute.set(key, {
              airport: getCityName(origin),
              destination: getCityName(dest),
              airline: flight.airlineName || "Unknown",
              flightNumber: flight.flightNumber,
              weeklyPattern: {monday:false,tuesday:false,wednesday:false,thursday:false,friday:false,saturday:false,sunday:false},
              scheduledTimes: {},
              lastSeenDates: {},
              frequency: 0
            });
          }
          
          const date = new Date(flight.scheduledTime);
          const day = dayNames[date.getDay()];
          // Convert UTC to Europe/Bucharest (+2 hours, simplified)
          let hrs = date.getUTCHours() + 2;
          if (hrs >= 24) hrs -= 24;
          const time = String(hrs).padStart(2,"0") + ":" + String(date.getUTCMinutes()).padStart(2,"0");
          const dateStr = date.toISOString().split("T")[0];
          
          const route = flightsByRoute.get(key);
          route.weeklyPattern[day] = true;
          if (!route.scheduledTimes[day]) route.scheduledTimes[day] = [];
          if (!route.scheduledTimes[day].includes(time)) route.scheduledTimes[day].push(time);
          if (!route.lastSeenDates[day] || route.lastSeenDates[day] < dateStr) route.lastSeenDates[day] = dateStr;
          route.frequency++;
        });
      } catch(e) {}
    });
  } catch(e) {}
  if ((idx+1) % 100 === 0) console.log("Processed " + (idx+1) + "/" + dirs.length);
});

const scheduleData = Array.from(flightsByRoute.values()).map(r => ({
  ...r,
  lastUpdated: new Date().toISOString(),
  dataSource: "historical"
}));
scheduleData.sort((a,b) => b.frequency - a.frequency);

const output = { data: scheduleData, metadata: { savedAt: new Date().toISOString(), count: scheduleData.length, version: "1.0" }};
fs.writeFileSync("./.cache/weekly_schedule_table.json", JSON.stringify(output, null, 2));
console.log("Done! " + scheduleData.length + " routes rebuilt.");

const os716 = scheduleData.find(r => r.flightNumber === "OS 716" && r.destination === "Viena");
if (os716) console.log("OS 716 RMO-VIE:", JSON.stringify(os716.scheduledTimes));
