
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
    // This function will be called by the Google Maps script once it's loaded.
    // Alternatively, we can check for window.google periodically.
    window.initMap = () => {
      setIsApiLoaded(true);
    };
    // If google.maps is already loaded (e.g., on HMR or subsequent navigations), set isApiLoaded true
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
        // mapId: 'TACNA_TRANSIT_MAP', // Removing mapId to default to standard map, avoids potential configuration issues
        streetViewControl: false,
        mapTypeControl: false,
      });
      setMap(newMap);
    }
  }, [isApiLoaded, map]);

  // Effect for admin-defined routes
  useEffect(() => {
    if (!map) return;

    // Clear existing admin polylines
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
                path: 'M 0,-1 0,1', // Simple dash
                strokeOpacity: 1,
                scale: 3,
                strokeColor: '#FF0000', // Ensure dash color matches line
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
        strokeColor: '#008000', // Green for AI suggested path
        strokeOpacity: 0.9,
        strokeWeight: 6,
        map: map,
        zIndex: 2 // AI route on top
      });
    }
  }, [map, aiSuggestedPathCoordinates]);


  // Effect for Origin/Destination markers and map bounds
  useEffect(() => {
    if (!map) return;

    // Clear previous markers
    if (originMarkerRef.current) {
      originMarkerRef.current.setMap(null);
      originMarkerRef.current = null;
    }
    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setMap(null);
      destinationMarkerRef.current = null;
    }

    const bounds = new google.maps.LatLngBounds();

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
          strokeWeight: 2,
          strokeColor: '#FFFFFF' // White border for visibility
        },
        zIndex: 3 // Markers on top
      });
      bounds.extend(new google.maps.LatLng(origin.lat, origin.lng));
    }

    if (destination) {
      destinationMarkerRef.current = new google.maps.Marker({
        position: destination,
        map: map,
        title: 'Destino',
         icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, // Arrow icon
          scale: 7,
          rotation: 0, // Adjust if needed based on map heading or path
          fillColor: '#FF4500', // Red-Orange
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF' // White border
        },
        zIndex: 3 // Markers on top
      });
      bounds.extend(new google.maps.LatLng(destination.lat, destination.lng));
    }

    // Include AI path in bounds calculation if it exists
    if (aiSuggestedPathCoordinates && aiSuggestedPathCoordinates.length > 0) {
      aiSuggestedPathCoordinates.forEach(coord => bounds.extend(new google.maps.LatLng(coord.lat, coord.lng)));
    }
    
    // Fit map to bounds if any elements are present
    if (origin || destination || (aiSuggestedPathCoordinates && aiSuggestedPathCoordinates.length > 0)) {
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
        // Prevent excessive zoom after fitBounds on single points or very short paths
        if (map.getZoom() && map.getZoom() > 16) {
             map.setZoom(16);
        }
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
