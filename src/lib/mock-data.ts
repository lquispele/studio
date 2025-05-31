import type { Route, CongestionData, NamedLocation } from './types';

// Coordinates are approximate for Tacna, Peru
// Centered around: -18.0146° S, -70.2536° W

export const initialRoutesData: Route[] = [
  {
    id: 'R001',
    name: 'Ruta 101 - Circunvalación',
    pathDescription: 'Av. Bolognesi -> Ovalo Túpac Amaru -> Av. Leguía -> Av. Basadre y Forero',
    status: 'open',
    coordinates: [
      { lat: -18.0100, lng: -70.2500 },
      { lat: -18.0080, lng: -70.2450 }, // Ovalo Túpac Amaru (approx)
      { lat: -18.0150, lng: -70.2430 }, // Av. Leguía
      { lat: -18.0180, lng: -70.2520 }, // Av. Basadre y Forero
      { lat: -18.0100, lng: -70.2500 }, // Return to start for loop
    ]
  },
  {
    id: 'R002',
    name: 'Ruta 20AB - Centro Histórico',
    pathDescription: 'Plaza de Armas -> Calle San Martín -> Mercado Central -> Calle Callao',
    status: 'open',
    coordinates: [
      { lat: -18.0146, lng: -70.2536 }, // Plaza de Armas
      { lat: -18.0135, lng: -70.2515 }, // Calle San Martín
      { lat: -18.0165, lng: -70.2510 }, // Mercado Central
      { lat: -18.0155, lng: -70.2545 }, // Calle Callao
      { lat: -18.0146, lng: -70.2536 }  // Return to Plaza
    ]
  },
  {
    id: 'R003',
    name: 'Ruta Expreso Norte (Pocollay)',
    pathDescription: 'Terminal Pocollay -> Av. Collpa -> Óvalo Cusco -> Av. Panamericana Norte',
    status: 'blocked', // Example of a blocked route
    coordinates: [
      { lat: -18.0000, lng: -70.2400 }, // Pocollay (approx)
      { lat: -17.9950, lng: -70.2450 }, // Av. Collpa / Ovalo Cusco
      { lat: -17.9850, lng: -70.2550 }, // Av. Panamericana Norte
      { lat: -18.0000, lng: -70.2400 },
    ]
  },
  {
    id: 'R004',
    name: 'Ruta Sur Alimentadora (Gregorio Albarracín)',
    pathDescription: 'Óvalo La Cultura -> Av. Municipal -> Hospital Unanue -> Av. La Cultura',
    status: 'open',
    coordinates: [
      { lat: -18.0350, lng: -70.2500 }, // Ovalo La Cultura (G. Albarracín)
      { lat: -18.0300, lng: -70.2450 }, // Av. Municipal
      { lat: -18.0280, lng: -70.2490 }, // Hospital Unanue
      { lat: -18.0350, lng: -70.2500 },
    ]
  },
];

export const initialCongestionData: CongestionData = {
  'Ruta 101 - Circunvalación': 20,
  'Ruta 20AB - Centro Histórico': 55,
  'Ruta Expreso Norte (Pocollay)': 100, // Reflects blocked status
  'Ruta Sur Alimentadora (Gregorio Albarracín)': 30,
};

export const initialNamedLocations: NamedLocation[] = [
  { id: 'loc001', name: 'Plaza de Armas de Tacna', coordinates: { lat: -18.0146, lng: -70.2536 } },
  { id: 'loc002', name: 'Mercado Central de Tacna', coordinates: { lat: -18.0165, lng: -70.2510 } },
  { id: 'loc003', name: 'Terminal Terrestre Manuel A. Odría', coordinates: { lat: -18.0040, lng: -70.2620 } },
  { id: 'loc004', name: 'Hospital Hipólito Unanue', coordinates: { lat: -18.0280, lng: -70.2490 } },
  { id: 'loc005', name: 'Universidad Nacional Jorge Basadre Grohmann', coordinates: { lat: -18.0080, lng: -70.2400 } },
  { id: 'loc006', name: 'Real Plaza Tacna', coordinates: { lat: -18.0005, lng: -70.2470 } },
  { id: 'loc007', name: 'Parque Industrial de Tacna', coordinates: { lat: -17.9900, lng: -70.2500 } },
  { id: 'loc008', name: 'Óvalo Túpac Amaru', coordinates: { lat: -18.0080, lng: -70.2450 } },
  { id: 'loc009', name: 'Distrito de Pocollay (Plaza)', coordinates: { lat: -18.0010, lng: -70.2380 } },
  { id: 'loc010', name: 'Distrito Gregorio Albarracín (Plaza)', coordinates: { lat: -18.0380, lng: -70.2510 } },
];

export const LOCAL_STORAGE_ROUTES_KEY = 'tacnaTransitRoutes_v2'; // Increment version to avoid conflicts with old data
