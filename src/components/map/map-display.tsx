'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Route } from '@/lib/types';
import { RouteLine } from './route-line';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { initialNamedLocations } from '@/lib/mock-data'; // Default center if no origin/dest

interface MapDisplayProps {
  routes: Route[];
  origin?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
}

const TACNA_CENTER = { lat: -18.0146, lng: -70.2536 };

export function MapDisplay({ routes, origin, destination }: MapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const originMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    window.initMap = () => {
      setIsApiLoaded(true);
    };
    // If API is already loaded (e.g. fast navigation), set manually
    if (window.google && window.google.maps) {
        setIsApiLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isApiLoaded || !mapRef.current || map) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: origin || destination || TACNA_CENTER,
      zoom: 13,
      mapId: 'TACNA_TRANSIT_MAP' // Optional: for cloud-based map styling
    });
    setMap(newMap);

  }, [isApiLoaded, map, origin, destination]);

  useEffect(() => {
    if (!map) return;

    // Clear existing polylines
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    polylinesRef.current = [];

    routes.forEach(route => {
      if (route.coordinates && route.coordinates.length > 1) {
        const path = route.coordinates.map(coord => ({ lat: coord.lat, lng: coord.lng }));
        const isBlocked = route.status === 'blocked';
        
        const polyline = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: isBlocked ? '#FF0000' : '#0000FF', // Red for blocked, Blue for open
          strokeOpacity: 0.8,
          strokeWeight: isBlocked ? 4 : 3,
          map: map,
          icons: isBlocked ? [{
            icon: {
                path: 'M 0,-1 0,1',
                strokeOpacity: 1,
                scale: 3,
                strokeWeight: 2,
            },
            offset: '0',
            repeat: '10px'
          }] : undefined,
        });
        polylinesRef.current.push(polyline);
      }
    });
  }, [map, routes]);

  useEffect(() => {
    if (!map) return;

    // Clear existing origin marker
    if (originMarkerRef.current) {
      originMarkerRef.current.setMap(null);
      originMarkerRef.current = null;
    }
    // Clear existing destination marker
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
      destinationMarkerRef.current = null;
    }

    if (origin) {
      originMarkerRef.current = new google.maps.Marker({
        position: origin,
        map: map,
        title: 'Origen',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#FFA500', // Orange
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: '#FFFFFF' // White border
        }
      });
    }

    if (destination) {
      destinationMarkerRef.current = new google.maps.Marker({
        position: destination,
        map: map,
        title: 'Destino',
         icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, // Or other suitable path
          scale: 6,
          fillColor: '#FFA500', // Orange
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: '#FFFFFF', // White border
          rotation: 0 // Adjust if needed
        }
      });
    }

    // Adjust map bounds if both origin and destination are set
    if (origin && destination && map) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(origin);
        bounds.extend(destination);
        map.fitBounds(bounds);
        // Add a bit of padding, zoom out if too close
        if (map.getZoom() && map.getZoom() > 15) {
            map.setZoom(15);
        }
    } else if (origin && map) {
        map.setCenter(origin);
        map.setZoom(14);
    } else if (destination && map) {
        map.setCenter(destination);
        map.setZoom(14);
    }


  }, [map, origin, destination]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Mapa de Rutas de Tacna (Google Maps)</CardTitle>
        <CardDescription>Visualización del estado actual de las rutas. Puede seleccionar origen y destino en el formulario de abajo.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Mapa Interactivo</h3>
            <div ref={mapRef} className="w-full h-[500px] bg-muted rounded-lg border shadow-inner" />
            <p className="text-xs text-muted-foreground mt-2">
              Rutas bloqueadas se indican en rojo discontinuo, abiertas en azul. Origen (círculo) y destino (flecha) se marcan en naranja.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Estado de las Rutas</h3>
            {routes.length > 0 ? (
              <ScrollArea className="h-[300px] pr-3">
                <div className="space-y-3">
                  {routes.map((route) => (
                    <RouteLine key={route.id} route={route} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No hay rutas para mostrar.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
