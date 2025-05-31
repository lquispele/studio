
'use client';

import { useState, useEffect } from 'react';
import { MapDisplay } from '@/components/map/map-display';
import { RouteOptimizationForm } from '@/components/route-optimization/route-optimization-form';
import type { Route, CongestionData, NamedLocation, PathGenerationResult, AIConceptualPath, RouteCoordinate } from '@/lib/types';
import { initialRoutesData, initialCongestionData, initialNamedLocations, LOCAL_STORAGE_ROUTES_KEY } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function HomePage() {
  const [routes, setRoutes] = useState<Route[]>(initialRoutesData);
  const [congestion, setCongestion] = useState<CongestionData>(initialCongestionData);
  const [namedLocations] = useState<NamedLocation[]>(initialNamedLocations); // Kept for potential future use

  // These now store geocoded coordinates or null
  const [selectedOrigin, setSelectedOrigin] = useState<RouteCoordinate | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<RouteCoordinate | null>(null);
  
  const [aiConceptualPathInfo, setAiConceptualPathInfo] = useState<AIConceptualPath | null>(null);
  const [detailedPathForMapCoordinates, setDetailedPathForMapCoordinates] = useState<RouteCoordinate[] | null>(null);

  const [isClient, setIsClient] = useState(false);

  const isValidRouteArray = (data: any): data is Route[] => {
    return Array.isArray(data) && data.every(r =>
      r.id && typeof r.id === 'string' &&
      r.name && typeof r.name === 'string' &&
      r.status && (r.status === 'open' || r.status === 'blocked') &&
      r.pathDescription && typeof r.pathDescription === 'string' &&
      r.coordinates && Array.isArray(r.coordinates) &&
      (r.coordinates.length === 0 || r.coordinates.every((c: any) => typeof c.lat === 'number' && typeof c.lng === 'number'))
    );
  };

  useEffect(() => {
    setIsClient(true);
    try {
      const storedRoutes = localStorage.getItem(LOCAL_STORAGE_ROUTES_KEY);
      if (storedRoutes) {
        const parsedRoutes = JSON.parse(storedRoutes);
        if (isValidRouteArray(parsedRoutes)) {
           setRoutes(parsedRoutes);
        } else {
          console.warn("Invalid route data in localStorage, resetting to default.");
          localStorage.setItem(LOCAL_STORAGE_ROUTES_KEY, JSON.stringify(initialRoutesData));
          setRoutes(initialRoutesData);
        }
      } else {
        localStorage.setItem(LOCAL_STORAGE_ROUTES_KEY, JSON.stringify(initialRoutesData));
      }
    } catch (error) {
      console.error("Failed to load routes from localStorage:", error);
      localStorage.setItem(LOCAL_STORAGE_ROUTES_KEY, JSON.stringify(initialRoutesData));
      setRoutes(initialRoutesData);
    }
  }, []);

  // This useEffect clears paths if origin/destination text changes (handled via form's watch now)
  // but also good to clear if admin routes change as they affect suggestions.
  useEffect(() => {
    if (!isClient) return;
    setAiConceptualPathInfo(null);
    setDetailedPathForMapCoordinates(null);
    // selectedOrigin & selectedDestination are cleared by the form now
  }, [routes, isClient]);

  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_ROUTES_KEY && event.newValue) {
        try {
          const updatedRoutes = JSON.parse(event.newValue);
           if (isValidRouteArray(updatedRoutes)) {
            setRoutes(updatedRoutes);
            // Also clear paths and selections as admin routes might affect suggestions/validity
            setAiConceptualPathInfo(null);
            setDetailedPathForMapCoordinates(null);
            setSelectedOrigin(null);
            setSelectedDestination(null);
            // The form will also reset its text inputs due to 'routes' dependency in its own useEffect
          } else {
            console.warn("Invalid route data from storage event, ignoring update.");
          }
        } catch (error) {
          console.error("Failed to parse updated routes from localStorage:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isClient]);

  const handlePathGenerated = (result: PathGenerationResult) => {
    setAiConceptualPathInfo(result.conceptualPath);
    setDetailedPathForMapCoordinates(result.detailedMapPath);
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p>Cargando navegador de tránsito...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline text-primary mb-2">Bienvenido a Tacna Transit Navigator</h1>
        <p className="text-lg text-muted-foreground">Optimice sus viajes en bus por Tacna. Evite congestiones y rutas bloqueadas.</p>
      </div>

      <RouteOptimizationForm
        routes={routes}
        congestionData={congestion}
        namedLocations={namedLocations} // Kept for potential future use by form
        selectedOrigin={selectedOrigin}
        setSelectedOrigin={setSelectedOrigin} // For form to update HomePage state
        selectedDestination={selectedDestination}
        setSelectedDestination={setSelectedDestination} // For form to update HomePage state
        onPathGenerated={handlePathGenerated}
        aiConceptualPathInfo={aiConceptualPathInfo}
      />

      <MapDisplay
        routes={routes}
        origin={selectedOrigin} // Pass geocoded origin
        destination={selectedDestination} // Pass geocoded destination
        aiSuggestedPathCoordinates={detailedPathForMapCoordinates}
      />

      <Card className="mt-8 bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary"><AlertCircle /> Información Importante</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/80">
              <li>El estado de las rutas administrables (abierta/bloqueada) se actualiza en tiempo real si un administrador realiza cambios.</li>
              <li>Ingrese direcciones o lugares en los campos de origen/destino. El sistema usará Google Geocoding para encontrar las coordenadas.</li>
              <li>Las sugerencias de rutas son generadas por IA, que proporciona waypoints estratégicos. Google Maps calcula la ruta detallada.</li>
              <li>Los datos de congestión para rutas administrables son simulados.</li>
               <li>La visualización del mapa utiliza Google Maps.</li>
            </ul>
          </AlertDescription>
        </CardContent>
      </Card>
    </div>
  );
}

    
