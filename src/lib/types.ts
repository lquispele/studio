export interface RouteCoordinate {
  lat: number;
  lng: number;
}

export interface Route {
  id: string;
  name: string;
  pathDescription: string; // For display purposes
  status: 'open' | 'blocked';
  coordinates: RouteCoordinate[]; // For Google Maps
}

export interface CongestionData {
  [routeName: string]: number; // Congestion level 0-100
}

export interface NamedLocation {
  id: string;
  name: string;
  coordinates: RouteCoordinate; // For Google Maps
}

export interface AISuggestedPath {
  description: string;
  coordinates: RouteCoordinate[];
  reasoning: string;
}
