import type { Route, CongestionData, NamedLocation } from './types';

export const initialRoutesData: Route[] = [
  { 
    id: 'R001', 
    name: 'Ruta 101 - Circunvalación', 
    pathDescription: 'Av. Principal -> Calle Robles -> Av. Sol', 
    status: 'open',
    coordinates: [ { x: 50, y: 100 }, { x: 250, y: 150 }, { x: 300, y: 400 }, { x: 100, y: 350 }, { x: 50, y: 100} ]
  },
  { 
    id: 'R002', 
    name: 'Ruta 20AB - Centro Histórico', 
    pathDescription: 'Plaza Mayor -> Calle Comercio -> Mercado Central', 
    status: 'open',
    coordinates: [ { x: 400, y: 200 }, { x: 600, y: 250 }, { x: 550, y: 500 }, { x: 350, y: 450 }, { x: 400, y: 200 } ]
  },
  { 
    id: 'R003', 
    name: 'Ruta Expreso Norte', 
    pathDescription: 'Terminal Norte -> Vía Rápida -> Zona Industrial', 
    status: 'open',
    coordinates: [ { x: 700, y: 50 }, { x: 900, y: 100 }, { x: 1100, y: 300 }, { x: 1000, y: 500 }, { x: 700, y: 50 } ]
  },
  { 
    id: 'R004', 
    name: 'Ruta Sur Alimentadora', 
    pathDescription: 'Barrio Flores -> Av. Progreso -> Hospital Regional', 
    status: 'open',
    coordinates: [ { x: 150, y: 600 }, { x: 400, y: 650 }, { x: 600, y: 800 }, { x: 300, y: 850 }, { x: 150, y: 600 } ]
  },
];

export const initialCongestionData: CongestionData = {
  'Ruta 101 - Circunvalación': 30,
  'Ruta 20AB - Centro Histórico': 65,
  'Ruta Expreso Norte': 15,
  'Ruta Sur Alimentadora': 40,
};

export const initialNamedLocations: NamedLocation[] = [
  { id: 'loc001', name: 'Plaza Mayor', coordinates: { x: 450, y: 350 } },
  { id: 'loc002', name: 'Mercado Central', coordinates: { x: 500, y: 480 } },
  { id: 'loc003', name: 'Terminal Norte', coordinates: { x: 700, y: 70 } },
  { id: 'loc004', name: 'Hospital Regional', coordinates: { x: 450, y: 820 } },
  { id: 'loc005', name: 'Universidad Privada', coordinates: { x: 150, y: 200 } },
  { id: 'loc006', name: 'Centro Comercial Aventura', coordinates: { x: 800, y: 600 } },
  { id: 'loc007', name: 'Parque Industrial', coordinates: { x: 1050, y: 400 } },
];

export const LOCAL_STORAGE_ROUTES_KEY = 'tacnaTransitRoutes';
