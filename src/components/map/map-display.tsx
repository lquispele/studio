
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
    if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
        setIsApiLoaded(true);
    }
  }, []);

  // Initialize map instance
  useEffect(() => {
    if (isApiLoaded && mapRef.current && !map) {
      const newMap = new google.maps.Map(mapRef.current, {
        center: TACNA_CENTER,
        zoom: 13,
        streetViewControl: false,
        mapTypeControl: false,
      });
      setMap(newMap);
    }
  }, [isApiLoaded, map]);

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
          strokeColor: isBlocked ? '#FF0000' : '#0000FF', 
          strokeOpacity: isBlocked ? 0.7 : 0.6,
          strokeWeight: isBlocked ? 5 : 4,
          map: map,
          zIndex: 1, 
          icons: isBlocked ? [{
            icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3, strokeColor: '#FF0000', strokeWeight: 2 },
            offset: '0',
            repeat: '10px'
          }] : undefined,
        });
        adminPolylinesRef.current.push(polyline);
      }
    });
  }, [map, routes]);

  // Effect for AI-suggested path (detailed path from Google Directions)
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
        strokeColor: '#008000', 
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map: map,
        zIndex: 2 
      });
    }
  }, [map, aiSuggestedPathCoordinates]);

  // Effect for Origin/Destination markers
 useEffect(() => {
    if (!map) return;

    // Manage Origin Marker
    if (origin) {
      if (!originMarkerRef.current) {
        originMarkerRef.current = new google.maps.Marker({
          map: map,
          title: 'Origen',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#FFA500', // Orange
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF'
          },
          zIndex: 3
        });
      }
      originMarkerRef.current.setPosition(new google.maps.LatLng(origin.lat, origin.lng));
      if(!originMarkerRef.current.getMap()){ // Add to map if not already there
          originMarkerRef.current.setMap(map);
      }
    } else {
      if (originMarkerRef.current) {
        originMarkerRef.current.setMap(null); // Remove from map
        // originMarkerRef.current = null; // Don't nullify ref, just remove from map
      }
    }

    // Manage Destination Marker
    if (destination) {
      if (!destinationMarkerRef.current) {
        destinationMarkerRef.current = new google.maps.Marker({
          map: map,
          title: 'Destino',
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 7,
            rotation: 0,
            fillColor: '#FF4500', // Red-Orange
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF'
          },
          zIndex: 3
        });
      }
      destinationMarkerRef.current.setPosition(new google.maps.LatLng(destination.lat, destination.lng));
      if(!destinationMarkerRef.current.getMap()){ // Add to map if not already there
          destinationMarkerRef.current.setMap(map);
      }
    } else {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null); // Remove from map
        // destinationMarkerRef.current = null; // Don't nullify ref, just remove from map
      }
    }
  }, [map, origin, destination]);

  // Effect for map bounds
  useEffect(() => {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();
    let hasElementsToBound = false;

    if (origin) {
      bounds.extend(new google.maps.LatLng(origin.lat, origin.lng));
      hasElementsToBound = true;
    }
    if (destination) {
      bounds.extend(new google.maps.LatLng(destination.lat, destination.lng));
      hasElementsToBound = true;
    }
    if (aiSuggestedPathCoordinates && aiSuggestedPathCoordinates.length > 0) {
      aiSuggestedPathCoordinates.forEach(coord => bounds.extend(new google.maps.LatLng(coord.lat, coord.lng)));
      hasElementsToBound = true;
    }
    
    if (hasElementsToBound) {
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
        // Prevent excessive zoom after fitBounds on single points or very short paths
        const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
            if (map.getZoom() && map.getZoom() > 16) {
                 map.setZoom(16);
            }
        });
        // Clean up listener to prevent memory leaks if component unmounts or effect re-runs
        return () => google.maps.event.removeListener(listener);
      }
    } else {
      // Default view if nothing is selected
      map.setCenter(TACNA_CENTER);
      map.setZoom(13);
    }
  }, [map, origin, destination, aiSuggestedPathCoordinates]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Mapa de Rutas de Tacna (Google Maps)</CardTitle>
        <CardDescription>
          Visualización de rutas administrables y sugerencias de IA. Ingrese origen/destino (con autocompletado) y obtenga una ruta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Mapa Interactivo</h3>
            <div ref={mapRef} className="w-full h-[500px] bg-muted rounded-lg border shadow-inner" />
            <p className="text-xs text-muted-foreground mt-2">
              Rutas administrables: Azul (abierta), Rojo discontinuo (bloqueada). Ruta IA/Google: Verde. Origen: Naranja. Destino: Rojo-Naranja.
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
