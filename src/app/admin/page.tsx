'use client';

import { useState, useEffect } from 'react';
import { RouteManagementTable } from '@/components/admin/route-management-table';
import type { Route } from '@/lib/types';
import { initialRoutesData, LOCAL_STORAGE_ROUTES_KEY } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, RotateCcw, ShieldAlert } from 'lucide-react';

export default function AdminPage() {
  const [routes, setRoutes] = useState<Route[]>(initialRoutesData);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const isValidRouteArray = (data: any): data is Route[] => {
    return Array.isArray(data) && data.every(r => 
      r.id && typeof r.id === 'string' &&
      r.name && typeof r.name === 'string' &&
      r.status && (r.status === 'open' || r.status === 'blocked') &&
      r.pathDescription && typeof r.pathDescription === 'string' &&
      r.coordinates && Array.isArray(r.coordinates) && 
      (r.coordinates.length === 0 || r.coordinates.every((c: any) => typeof c.x === 'number' && typeof c.y === 'number'))
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
          setRoutes(initialRoutesData);
          localStorage.setItem(LOCAL_STORAGE_ROUTES_KEY, JSON.stringify(initialRoutesData));
          toast({
            title: "Datos de rutas corruptos",
            description: "Se han restaurado los datos de rutas por defecto.",
            variant: "destructive"
          });
        }
      } else {
        localStorage.setItem(LOCAL_STORAGE_ROUTES_KEY, JSON.stringify(initialRoutesData));
      }
    } catch (error) {
      console.error("Failed to load routes from localStorage for admin:", error);
      setRoutes(initialRoutesData); 
      localStorage.setItem(LOCAL_STORAGE_ROUTES_KEY, JSON.stringify(initialRoutesData));
       toast({
            title: "Error al cargar rutas",
            description: "No se pudieron cargar las rutas guardadas. Se usaron los valores por defecto.",
            variant: "destructive"
      });
    }
  }, [toast]);

  const handleToggleRouteStatus = (routeId: string) => {
    setRoutes(prevRoutes =>
      prevRoutes.map(route =>
        route.id === routeId
          ? { ...route, status: route.status === 'open' ? 'blocked' : 'open' }
          : route
      )
    );
  };

  const handleSaveChanges = () => {
    if(!isClient) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_ROUTES_KEY, JSON.stringify(routes));
      toast({
        title: "Cambios Guardados",
        description: "El estado de las rutas ha sido actualizado.",
        variant: "default"
      });
    } catch (error) {
      console.error("Failed to save routes to localStorage:", error);
       toast({
        title: "Error al Guardar",
        description: "No se pudieron guardar los cambios en las rutas.",
        variant: "destructive"
      });
    }
  };
  
  const handleResetToDefault = () => {
    if(!isClient) return;
    setRoutes(initialRoutesData);
    try {
      localStorage.setItem(LOCAL_STORAGE_ROUTES_KEY, JSON.stringify(initialRoutesData));
      toast({
        title: "Rutas Restauradas",
        description: "Todas las rutas han sido restauradas a su estado por defecto.",
        variant: "default"
      });
    } catch (error) {
       console.error("Failed to reset routes in localStorage:", error);
       toast({
        title: "Error al Restaurar",
        description: "No se pudieron restaurar las rutas por defecto.",
        variant: "destructive"
      });
    }
  };

  if (!isClient) {
    return (
       <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <p>Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-3xl text-primary">Panel de Administración de Rutas</CardTitle>
                <CardDescription className="mt-1">
                Modifique el estado de las rutas (abierta/bloqueada). Los cambios se guardarán localmente en su navegador y
                se reflejarán para los usuarios que utilicen la aplicación en este mismo navegador.
                </CardDescription>
            </div>
            <ShieldAlert className="h-10 w-10 text-primary"/>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col sm:flex-row gap-2 justify-end">
            <Button onClick={handleSaveChanges} variant="default">
                <Save className="mr-2 h-4 w-4" /> Guardar Cambios
            </Button>
            <Button onClick={handleResetToDefault} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> Restaurar por Defecto
            </Button>
        </div>
        <RouteManagementTable routes={routes} onToggleRouteStatus={handleToggleRouteStatus} />
      </CardContent>
    </Card>
  );
}
