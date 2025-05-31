'use client';

import { useState, useEffect } from 'react';
import { MapDisplay } from '@/components/map/map-display';
import { RouteOptimizationForm } from '@/components/route-optimization/route-optimization-form';
import type { Route, CongestionData } from '@/lib/types';
import { initialRoutesData, initialCongestionData, LOCAL_STORAGE_ROUTES_KEY } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert'; // AlertTitle removed as it's not used directly here

export default function HomePage() {
  const [routes, setRoutes] = useState<Route[]>(initialRoutesData);
  const [congestion, setCongestion] = useState<CongestionData>(initialCongestionData);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedRoutes = localStorage.getItem(LOCAL_STORAGE_ROUTES_KEY);
      if (storedRoutes) {
        const parsedRoutes = JSON.parse(storedRoutes) as Route[];
        if (Array.isArray(parsedRoutes) && parsedRoutes.every(r => r.id && r.name && r.status)) {
           setRoutes(parsedRoutes);
        } else {
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

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_ROUTES_KEY && event.newValue) {
        try {
          const updatedRoutes = JSON.parse(event.newValue) as Route[];
           if (Array.isArray(updatedRoutes) && updatedRoutes.every(r => r.id && r.name && r.status)) {
            setRoutes(updatedRoutes);
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
      
      <MapDisplay routes={routes} />
      <RouteOptimizationForm routes={routes} congestionData={congestion} />

      <Card className="mt-8 bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary"><AlertCircle /> Información Importante</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDescription>
            <ul className="list-disc pl-5 space-y-1 text-sm text-foreground/80">
              <li>El estado de las rutas (abierta/bloqueada) se actualiza en tiempo real si un administrador realiza cambios.</li>
              <li>Las sugerencias de rutas alternativas son generadas por IA y buscan la opción más eficiente.</li>
              <li>Los datos de congestión son simulados para esta demostración.</li>
            </ul>
          </AlertDescription>
        </CardContent>
      </Card>
    </div>
  );
}
