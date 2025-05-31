export interface Route {
  id: string;
  name: string;
  pathDescription: string; // For display purposes
  status: 'open' | 'blocked';
  coordinates: Array<{ lat: number; lng: number }>; // For Google Maps
}

export interface CongestionData {
  [routeName: string]: number; // Congestion level 0-100
}

export interface NamedLocation {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number }; // For Google Maps
}
