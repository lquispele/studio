
'use client';

import { useState, useEffect } from 'react';
import { MapDisplay } from '@/components/map/map-display';
import { RouteOptimizationForm } from '@/components/route-optimization/route-optimization-form';
import type { Route, CongestionData, NamedLocation, RouteCoordinate, AISuggestedPath } from '@/lib/types';
import { initialRoutesData, initialCongestionData, initialNamedLocations, LOCAL_STORAGE_ROUTES_KEY } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function HomePage() {
  const [routes, setRoutes] = useState<Route[]>(initialRoutesData);
  const [congestion, setCongestion] = useState<CongestionData>(initialCongestionData);
  const [namedLocations] = useState<NamedLocation[]>(initialNamedLocations);
  const [selectedOrigin, setSelectedOrigin] = useState<NamedLocation | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<NamedLocation | null>(null);
  const [aiSuggestedPath, setAiSuggestedPath] = useState<AISuggestedPath | null>(null);
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

  useEffect(() => {
    if (!isClient) return;
    // Clear AI path if origin or destination changes
    setAiSuggestedPath(null);
  }, [selectedOrigin, selectedDestination, isClient]);

  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_ROUTES_KEY && event.newValue) {
        try {
          const updatedRoutes = JSON.parse(event.newValue);
           if (isValidRouteArray(updatedRoutes)) {
            setRoutes(updatedRoutes);
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

      <MapDisplay
        routes={routes}
        origin={selectedOrigin?.coordinates || null}
        destination={selectedDestination?.coordinates || null}
        aiSuggestedPathCoordinates={aiSuggestedPath?.coordinates || null}
      />
      <RouteOptimizationForm
        routes={routes}
        congestionData={congestion}
        namedLocations={namedLocations}
        selectedOrigin={selectedOrigin}
        setSelectedOrigin={setSelectedOrigin}
        selectedDestination={selectedDestination}
        setSelectedDestination={setSelectedDestination}
        onOptimizationResult={setAiSuggestedPath}
      />

      <Card className="mt-8 bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary"><AlertCircle /> Información Importante</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/80">
              <li>El estado de las rutas administrables (abierta/bloqueada) se actualiza en tiempo real si un administrador realiza cambios.</li>
              <li>Las sugerencias de rutas son generadas por IA y buscan la opción más eficiente entre el origen y destino seleccionados.</li>
              <li>Los datos de congestión para rutas administrables y ubicaciones (origen/destino) son simulados.</li>
               <li>La visualización del mapa utiliza Google Maps.</li>
            </ul>
          </AlertDescription>
        </CardContent>
      </Card>
    </div>
  );
}
