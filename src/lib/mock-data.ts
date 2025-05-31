import type { Route, CongestionData, NamedLocation } from './types';

// Coordinates are approximate for Tacna, Peru
// Centered around: -18.0146° S, -70.2536° W

export const initialRoutesData: Route[] = [
  { 
    id: 'R001', 
    name: 'Ruta 101 - Circunvalación', 
    pathDescription: 'Av. Principal -> Calle Robles -> Av. Sol', 
    status: 'open',
    coordinates: [ 
      { lat: -18.0100, lng: -70.2500 }, 
      { lat: -18.0120, lng: -70.2450 }, 
      { lat: -18.0180, lng: -70.2480 }, 
      { lat: -18.0150, lng: -70.2550 },
      { lat: -18.0100, lng: -70.2500 } 
    ]
  },
  { 
    id: 'R002', 
    name: 'Ruta 20AB - Centro Histórico', 
    pathDescription: 'Plaza Mayor -> Calle Comercio -> Mercado Central', 
    status: 'open',
    coordinates: [ 
      { lat: -18.0140, lng: -70.2530 }, 
      { lat: -18.0130, lng: -70.2500 }, 
      { lat: -18.0160, lng: -70.2490 }, 
      { lat: -18.0170, lng: -70.2540 },
      { lat: -18.0140, lng: -70.2530 }
    ]
  },
  { 
    id: 'R003', 
    name: 'Ruta Expreso Norte', 
    pathDescription: 'Terminal Norte -> Vía Rápida -> Zona Industrial', 
    status: 'open',
    coordinates: [ 
      { lat: -18.0050, lng: -70.2600 }, 
      { lat: -18.0000, lng: -70.2580 }, 
      { lat: -17.9950, lng: -70.2550 },
      { lat: -18.0050, lng: -70.2600 }
    ]
  },
  { 
    id: 'R004', 
    name: 'Ruta Sur Alimentadora', 
    pathDescription: 'Barrio Flores -> Av. Progreso -> Hospital Regional', 
    status: 'open',
    coordinates: [ 
      { lat: -18.0200, lng: -70.2500 }, 
      { lat: -18.0250, lng: -70.2450 }, 
      { lat: -18.0300, lng: -70.2550 },
      { lat: -18.0200, lng: -70.2500 }
    ]
  },
];

export const initialCongestionData: CongestionData = {
  'Ruta 101 - Circunvalación': 30,
  'Ruta 20AB - Centro Histórico': 65,
  'Ruta Expreso Norte': 15,
  'Ruta Sur Alimentadora': 40,
};

export const initialNamedLocations: NamedLocation[] = [
  { id: 'loc001', name: 'Plaza de Armas de Tacna', coordinates: { lat: -18.0146, lng: -70.2536 } }, // Tacna center
  { id: 'loc002', name: 'Mercado Central de Tacna', coordinates: { lat: -18.0165, lng: -70.2510 } },
  { id: 'loc003', name: 'Terminal Terrestre Manuel A. Odría', coordinates: { lat: -18.0040, lng: -70.2620 } },
  { id: 'loc004', name: 'Hospital Hipólito Unanue', coordinates: { lat: -18.0280, lng: -70.2490 } },
  { id: 'loc005', name: 'Universidad Nacional Jorge Basadre Grohmann', coordinates: { lat: -18.0080, lng: -70.2400 } },
  { id: 'loc006', name: 'Real Plaza Tacna', coordinates: { lat: -18.0005, lng: -70.2470 } },
  { id: 'loc007', name: 'Parque Industrial de Tacna', coordinates: { lat: -17.9900, lng: -70.2500 } },
];

export const LOCAL_STORAGE_ROUTES_KEY = 'tacnaTransitRoutes';
