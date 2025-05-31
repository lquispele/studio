import Image from 'next/image';
import type { Route } from '@/lib/types';
import { RouteLine } from './route-line';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MapDisplayProps {
  routes: Route[];
}

export function MapDisplay({ routes }: MapDisplayProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Mapa de Rutas de Tacna</CardTitle>
        <CardDescription>Visualización del estado actual de las rutas. Las rutas se dibujan sobre el mapa simulado.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
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
              </svg>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Nota: Este es un mapa simulado. Las rutas bloqueadas se indican en rojo discontinuo y las abiertas en azul.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Estado de las Rutas</h3>
            {routes.length > 0 ? (
              <ScrollArea className="h-[300px] md:h-[calc(0.75*100vw/2-3rem)] max-h-[420px] pr-3"> {/* Adjusted height to better match map */}
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
