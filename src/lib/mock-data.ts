import type { Route, CongestionData } from './types';

export const initialRoutesData: Route[] = [
  { id: 'R001', name: 'Ruta 101 - Circunvalación', pathDescription: 'Av. Principal -> Calle Robles -> Av. Sol', status: 'open' },
  { id: 'R002', name: 'Ruta 20AB - Centro Histórico', pathDescription: 'Plaza Mayor -> Calle Comercio -> Mercado Central', status: 'open' },
  { id: 'R003', name: 'Ruta Expreso Norte', pathDescription: 'Terminal Norte -> Vía Rápida -> Zona Industrial', status: 'open' },
  { id: 'R004', name: 'Ruta Sur Alimentadora', pathDescription: 'Barrio Flores -> Av. Progreso -> Hospital Regional', status: 'open' },
];

export const initialCongestionData: CongestionData = {
  'Ruta 101 - Circunvalación': 30,
  'Ruta 20AB - Centro Histórico': 65,
  'Ruta Expreso Norte': 15,
  'Ruta Sur Alimentadora': 40,
};

export const LOCAL_STORAGE_ROUTES_KEY = 'tacnaTransitRoutes';
