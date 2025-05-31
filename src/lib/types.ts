export interface Route {
  id: string;
  name: string;
  pathDescription: string; // For display purposes
  status: 'open' | 'blocked';
  coordinates: Array<{ x: number; y: number }>; // For drawing on the simulated map
}

export interface CongestionData {
  [routeName: string]: number; // Congestion level 0-100
}
