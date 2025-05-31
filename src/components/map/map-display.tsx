import Image from 'next/image';
import type { Route } from '@/lib/types';
import { RouteLine } from './route-line';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pin, Navigation } from 'lucide-react';

interface MapDisplayProps {
  routes: Route[];
  origin?: { x: number; y: number } | null;
  destination?: { x: number; y: number } | null;
}

export function MapDisplay({ routes, origin, destination }: MapDisplayProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Mapa de Rutas de Tacna</CardTitle>
        <CardDescription>Visualización del estado actual de las rutas. Las rutas se dibujan sobre el mapa simulado. Puede seleccionar origen y destino en el formulario de abajo.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Mapa Interactivo (Simulado)</h3>
            <div className="aspect-[4/3] w-full bg-muted rounded-lg overflow-hidden border shadow-inner relative">
              <Image
                src="https://placehold.co/1200x900.png"
                alt="Mapa de Tacna"
                width={1200}
                height={900}
                className="object-cover w-full h-full"
                data-ai-hint="map tacna peru"
                priority
              />
              <svg
                viewBox="0 0 1200 900"
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                aria-hidden="true"
              >
                {routes.map((route) => (
                  route.coordinates && route.coordinates.length > 1 && (
                    <polyline
                      key={route.id}
                      points={route.coordinates.map(p => `${p.x},${p.y}`).join(' ')}
                      stroke={route.status === 'blocked' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                      strokeWidth="6" 
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={route.status === 'blocked' ? "15,10" : "none"}
                      className="transition-all duration-300"
                    />
                  )
                ))}
                {routes.map((route) => (
                   route.coordinates && route.coordinates.length > 0 && (
                    <text
                      key={`${route.id}-label`}
                      x={route.coordinates[0].x + 10}
                      y={route.coordinates[0].y - 10}
                      fill={route.status === 'blocked' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                      fontSize="24"
                      fontWeight="bold"
                      paintOrder="stroke"
                      stroke="hsl(var(--card))" 
                      strokeWidth="4px"
                      strokeLinecap="butt"
                      strokeLinejoin="miter"
                    >
                      {route.id}
                    </text>
                   )
                ))}
                {origin && (
                  <g transform={`translate(${origin.x}, ${origin.y})`}>
                    <circle cx="0" cy="0" r="12" fill="hsl(var(--accent))" stroke="hsl(var(--card))" strokeWidth="3" />
                    <Pin className="text-accent-foreground" x="-8" y="-23" size={16} strokeWidth={3} fill="hsl(var(--accent-foreground))" />
                  </g>
                )}
                {destination && (
                  <g transform={`translate(${destination.x}, ${destination.y})`}>
                     <circle cx="0" cy="0" r="12" fill="hsl(var(--accent))" stroke="hsl(var(--card))" strokeWidth="3" />
                     <Navigation className="text-accent-foreground" x="-8" y="-23" size={16} strokeWidth={3} fill="hsl(var(--accent-foreground))" />
                  </g>
                )}
              </svg>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Nota: Este es un mapa simulado. Las rutas bloqueadas se indican en rojo discontinuo y las abiertas en azul. Origen y destino se marcan con íconos naranjas.</p>
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
