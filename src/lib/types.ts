export interface Route {
  id: string;
  name: string;
  pathDescription: string; // For display purposes
  status: 'open' | 'blocked';
}

export interface CongestionData {
  [routeName: string]: number; // Congestion level 0-100
}
