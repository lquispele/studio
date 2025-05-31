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

export interface AIConceptualPath { // Renamed from AISuggestedPath for clarity
  description: string;
  coordinates: RouteCoordinate[]; // These are waypoints for Google Directions
  reasoning: string;
}

// Data structure passed from RouteOptimizationForm to HomePage
export interface PathGenerationResult {
  conceptualPath: AIConceptualPath | null; // For displaying AI text (description, reasoning)
  detailedMapPath: RouteCoordinate[] | null; // For drawing on the map (from Google Directions or AI fallback)
}
