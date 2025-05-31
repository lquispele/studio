
'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Route, RouteCoordinate } from '@/lib/types';
import { RouteLine } from './route-line';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MapDisplayProps {
  routes: Route[]; // Admin-defined routes
  origin?: RouteCoordinate | null;
  destination?: RouteCoordinate | null;
  aiSuggestedPathCoordinates?: RouteCoordinate[] | null;
}

const TACNA_CENTER = { lat: -18.0146, lng: -70.2536 };

export function MapDisplay({ routes, origin, destination, aiSuggestedPathCoordinates }: MapDisplayProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  const adminPolylinesRef = useRef<google.maps.Polyline[]>([]);
  const aiPathPolylineRef = useRef<google.maps.Polyline | null>(null);
  const originMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    window.initMap = () => {
      setIsApiLoaded(true);
    };
    if (window.google && window.google.maps) {
        setIsApiLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isApiLoaded || !mapRef.current || map) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: origin || destination || TACNA_CENTER,
      zoom: 13,
      mapId: 'TACNA_TRANSIT_MAP'
    });
    setMap(newMap);

  }, [isApiLoaded, map, origin, destination]);

  // Effect for admin-defined routes
  useEffect(() => {
    if (!map) return;

    adminPolylinesRef.current.forEach(polyline => polyline.setMap(null));
    adminPolylinesRef.current = [];

    routes.forEach(route => {
      if (route.coordinates && route.coordinates.length > 1) {
        const path = route.coordinates.map(coord => ({ lat: coord.lat, lng: coord.lng }));
        const isBlocked = route.status === 'blocked';

        const polyline = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: isBlocked ? '#FF0000' : '#0000FF', // Red for blocked, Blue for open
          strokeOpacity: isBlocked ? 0.7 : 0.6,
          strokeWeight: isBlocked ? 5 : 4,
          map: map,
          zIndex: 1, // Admin routes below AI route
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
        adminPolylinesRef.current.push(polyline);
      }
    });
  }, [map, routes]);

  // Effect for AI-suggested path
  useEffect(() => {
    if (!map) return;

    if (aiPathPolylineRef.current) {
      aiPathPolylineRef.current.setMap(null);
      aiPathPolylineRef.current = null;
    }

    if (aiSuggestedPathCoordinates && aiSuggestedPathCoordinates.length > 1) {
      const path = aiSuggestedPathCoordinates.map(coord => ({ lat: coord.lat, lng: coord.lng }));
      aiPathPolylineRef.current = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#008000', // Green for AI suggested path
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map: map,
        zIndex: 2 // AI route on top
      });

      // Adjust map to fit AI path, origin and destination
      const bounds = new google.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      if (origin) bounds.extend(origin);
      if (destination) bounds.extend(destination);
      
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
        if (map.getZoom() && map.getZoom() > 16) { // Don't zoom in too much
            map.setZoom(16);
        }
      }

    }
  }, [map, aiSuggestedPathCoordinates, origin, destination]);


  // Effect for Origin/Destination markers
  useEffect(() => {
    if (!map) return;

    if (originMarkerRef.current) {
      originMarkerRef.current.setMap(null);
      originMarkerRef.current = null;
    }
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
          fillColor: '#FFA500',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF'
        },
        zIndex: 3
      });
    }

    if (destination) {
      destinationMarkerRef.current = new google.maps.Marker({
        position: destination,
        map: map,
        title: 'Destino',
         icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: '#FF4500', // Slightly different orange/red for destination
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
        },
        zIndex: 3
      });
    }

    // Adjust map bounds only if AI path is not present
    if (!aiSuggestedPathCoordinates || aiSuggestedPathCoordinates.length === 0) {
        if (origin && destination) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(origin);
            bounds.extend(destination);
            map.fitBounds(bounds);
            if (map.getZoom() && map.getZoom() > 15) {
                map.setZoom(15);
            }
        } else if (origin) {
            map.setCenter(origin);
            map.setZoom(14);
        } else if (destination) {
            map.setCenter(destination);
            map.setZoom(14);
        } else {
            map.setCenter(TACNA_CENTER);
            map.setZoom(13);
        }
    }

  }, [map, origin, destination, aiSuggestedPathCoordinates]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Mapa de Rutas de Tacna (Google Maps)</CardTitle>
        <CardDescription>
          Visualización de rutas administrables y sugerencias de IA. Seleccione origen/destino y obtenga una ruta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Mapa Interactivo</h3>
            <div ref={mapRef} className="w-full h-[500px] bg-muted rounded-lg border shadow-inner" />
            <p className="text-xs text-muted-foreground mt-2">
              Rutas administrables: Azul (abierta), Rojo discontinuo (bloqueada). Ruta IA: Verde. Origen: Naranja. Destino: Rojo-Naranja.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Rutas Administrables Registradas</h3>
            {routes.length > 0 ? (
              <ScrollArea className="h-[200px] pr-3">
                <div className="space-y-3">
                  {routes.map((route) => (
                    <RouteLine key={route.id} route={route} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No hay rutas administrables registradas.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
