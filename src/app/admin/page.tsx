
'use client';

import { useState, useEffect } from 'react';
import { RouteManagementTable } from '@/components/admin/route-management-table';
import type { Route, RouteCoordinate } from '@/lib/types';
import { initialRoutesData, LOCAL_STORAGE_ROUTES_KEY } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, RotateCcw, ShieldAlert, PlusCircle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";


const routeFormSchema = z.object({
  id: z.string().min(1, 'ID es requerido').regex(/^[a-zA-Z0-9-_]+$/, "ID solo puede contener letras, números, '-' y '_'"),
  name: z.string().min(3, 'Nombre es requerido (mínimo 3 caracteres).'),
  pathDescription: z.string().min(5, 'Descripción es requerida (mínimo 5 caracteres).'),
  coordinates: z.string().min(1, 'Coordenadas son requeridas.').refine(val => {
    try {
      const pairs = val.split(';').map(p => p.trim()).filter(p => p.length > 0);
      if (pairs.length < 2) return false; // Must have at least 2 points
      return pairs.every(pair => {
        const parts = pair.split(',').map(s => s.trim());
        return parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]));
      });
    } catch {
      return false;
    }
  }, 'Formato de coordenadas inválido. Use "lat,lng; lat,lng; ..." y asegúrese de tener al menos 2 puntos.'),
});
type RouteFormValues = z.infer<typeof routeFormSchema>;


export default function AdminPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isAddRouteDialogOpen, setIsAddRouteDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: { id: '', name: '', pathDescription: '', coordinates: '' },
  });

  const isValidRouteObject = (r: any): r is Route => {
    return r && typeof r.id === 'string' &&
      typeof r.name === 'string' &&
      (r.status === 'open' || r.status === 'blocked') &&
      typeof r.pathDescription === 'string' &&
      Array.isArray(r.coordinates) &&
      (r.coordinates.length === 0 || r.coordinates.every((c: any) => typeof c.lat === 'number' && typeof c.lng === 'number'));
  }

  const isValidRouteArray = (data: any): data is Route[] => {
    return Array.isArray(data) && data.every(isValidRouteObject);
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
          console.warn("Invalid stored routes, restoring defaults.");
          setRoutes(initialRoutesData);
          localStorage.setItem(LOCAL_STORAGE_ROUTES_KEY, JSON.stringify(initialRoutesData));
        }
      } else {
        setRoutes(initialRoutesData);
        localStorage.setItem(LOCAL_STORAGE_ROUTES_KEY, JSON.stringify(initialRoutesData));
      }
    } catch (error) {
      console.error("Failed to load/parse routes from localStorage:", error);
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

  const saveRoutesToLocalStorage = (updatedRoutes: Route[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ROUTES_KEY, JSON.stringify(updatedRoutes));
    } catch (error) {
      console.error("Failed to save routes to localStorage:", error);
      toast({
        title: "Error al Guardar en LocalStorage",
        description: "No se pudieron persistir los cambios en las rutas.",
        variant: "destructive"
      });
    }
  }

  const handleSaveChanges = () => {
    if(!isClient) return;
    saveRoutesToLocalStorage(routes);
    toast({
      title: "Cambios Guardados",
      description: "El estado de las rutas ha sido actualizado.",
      variant: "default"
    });
  };

  const handleResetToDefault = () => {
    if(!isClient) return;
    setRoutes(initialRoutesData);
    saveRoutesToLocalStorage(initialRoutesData);
    toast({
      title: "Rutas Restauradas",
      description: "Todas las rutas han sido restauradas a su estado por defecto.",
      variant: "default"
    });
  };

  const parseCoordinatesString = (coordsString: string): RouteCoordinate[] => {
    return coordsString.split(';')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(pair => {
        const parts = pair.split(',').map(s => parseFloat(s.trim()));
        return { lat: parts[0], lng: parts[1] };
      });
  };

  const onAddRouteSubmit: SubmitHandler<RouteFormValues> = (data) => {
    if (routes.some(route => route.id === data.id)) {
      form.setError("id", { type: "manual", message: "Este ID de ruta ya existe." });
      return;
    }
    const newRoute: Route = {
      id: data.id,
      name: data.name,
      pathDescription: data.pathDescription,
      status: 'open', // Default new routes to open
      coordinates: parseCoordinatesString(data.coordinates),
    };
    const updatedRoutes = [...routes, newRoute];
    setRoutes(updatedRoutes);
    saveRoutesToLocalStorage(updatedRoutes);
    toast({ title: "Ruta Agregada", description: `La ruta "${data.name}" ha sido agregada.` });
    form.reset();
    setIsAddRouteDialogOpen(false);
  };

  const handleDeleteRoute = (routeIdToDelete: string) => {
    const updatedRoutes = routes.filter(route => route.id !== routeIdToDelete);
    setRoutes(updatedRoutes);
    saveRoutesToLocalStorage(updatedRoutes);
    toast({ title: "Ruta Eliminada", description: `La ruta con ID "${routeIdToDelete}" ha sido eliminada.` });
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
                Modifique el estado, agregue o elimine rutas. Los cambios se guardarán localmente.
                </CardDescription>
            </div>
            <ShieldAlert className="h-10 w-10 text-primary"/>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col sm:flex-row gap-2 justify-end items-center">
            <Dialog open={isAddRouteDialogOpen} onOpenChange={setIsAddRouteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" /> Agregar Nueva Ruta
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Agregar Nueva Ruta Administrable</DialogTitle>
                  <DialogDescription>
                    Complete los detalles de la nueva ruta. Las coordenadas deben estar en formato "lat,lng; lat,lng; ...".
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onAddRouteSubmit)} className="space-y-4 py-2">
                    <FormField control={form.control} name="id" render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID de Ruta (único)</FormLabel>
                          <FormControl><Input placeholder="Ej: R10X" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Ruta</FormLabel>
                          <FormControl><Input placeholder="Ej: Expreso Aeropuerto" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="pathDescription" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción de la Ruta</FormLabel>
                          <FormControl><Textarea placeholder="Ej: Av. Principal -> Calle Secundaria -> Destino Final" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="coordinates" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coordenadas (lat,lng; lat,lng; ...)</FormLabel>
                          <FormControl><Textarea rows={3} placeholder="-18.01, -70.25; -18.012, -70.252; -18.015, -70.255" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button type="submit">Agregar Ruta</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Button onClick={handleSaveChanges} variant="default">
                <Save className="mr-2 h-4 w-4" /> Guardar Cambios de Estado
            </Button>
            <Button onClick={handleResetToDefault} variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                <RotateCcw className="mr-2 h-4 w-4" /> Restaurar por Defecto
            </Button>
        </div>
        <RouteManagementTable
          routes={routes}
          onToggleRouteStatus={handleToggleRouteStatus}
          onDeleteRoute={handleDeleteRoute}
        />
      </CardContent>
    </Card>
  );
}
