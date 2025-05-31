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
        <CardDescription>Visualización del estado actual de las rutas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Mapa Interactivo (Simulado)</h3>
            <div className="aspect-[4/3] w-full bg-muted rounded-lg overflow-hidden border shadow-inner">
              <Image
                src="https://placehold.co/1200x900.png"
                alt="Mapa de Tacna"
                width={1200}
                height={900}
                className="object-cover w-full h-full"
                data-ai-hint="map tacna peru"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Nota: Este es un mapa simulado. Las rutas bloqueadas se indican en la lista de rutas.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Estado de las Rutas</h3>
            {routes.length > 0 ? (
              <ScrollArea className="h-[300px] md:h-[400px] pr-3">
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
