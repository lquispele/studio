'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { suggestAlternativeRoutes, type SuggestAlternativeRoutesInput, type SuggestAlternativeRoutesOutput } from '@/ai/flows/suggest-alternative-routes';
import type { Route, CongestionData, NamedLocation } from '@/lib/types';
import { Lightbulb, AlertTriangle, CheckCircle, MapPin, Navigation } from 'lucide-react';

const formSchema = z.object({
  currentRoute: z.string().min(1, 'Por favor, seleccione su ruta actual.'),
  origin: z.string().optional(),
  destination: z.string().optional(),
});

type RouteOptimizationFormValues = z.infer<typeof formSchema>;

interface RouteOptimizationFormProps {
  routes: Route[];
  congestionData: CongestionData;
  namedLocations: NamedLocation[];
  selectedOrigin: NamedLocation | null;
  setSelectedOrigin: (location: NamedLocation | null) => void;
  selectedDestination: NamedLocation | null;
  setSelectedDestination: (location: NamedLocation | null) => void;
}

export function RouteOptimizationForm({ 
  routes, 
  congestionData, 
  namedLocations,
  selectedOrigin,
  setSelectedOrigin,
  selectedDestination,
  setSelectedDestination
}: RouteOptimizationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState<SuggestAlternativeRoutesOutput | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<RouteOptimizationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentRoute: '',
      origin: '',
      destination: '',
    },
  });

  const availableRoutes = routes.filter(route => route.status === 'open');

  const handleOriginChange = (locationId: string) => {
    const location = namedLocations.find(loc => loc.id === locationId) || null;
    setSelectedOrigin(location);
    form.setValue('origin', locationId);
  };

  const handleDestinationChange = (locationId: string) => {
    const location = namedLocations.find(loc => loc.id === locationId) || null;
    setSelectedDestination(location);
    form.setValue('destination', locationId);
  };
  
  useEffect(() => {
    form.setValue('origin', selectedOrigin?.id || '');
    form.setValue('destination', selectedDestination?.id || '');
  }, [selectedOrigin, selectedDestination, form]);

  const onSubmit: SubmitHandler<RouteOptimizationFormValues> = async (data) => {
    setIsLoading(true);
    setAiResult(null);
    setAiError(null);

    const blockedRoutes = routes.filter(route => route.status === 'blocked').map(route => route.name);

    const input: SuggestAlternativeRoutesInput = {
      currentRoute: data.currentRoute, // AI still uses this primarily
      blockedRoutes,
      congestionData,
    };

    try {
      const result = await suggestAlternativeRoutes(input);
      setAiResult(result);
      toast({
        title: "Sugerencias generadas",
        description: "Se encontraron rutas alternativas basadas en su ruta actual seleccionada.",
        variant: "default",
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (error) {
      console.error('Error optimizing route:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
      setAiError(errorMessage);
      toast({
        title: "Error en la optimización",
        description: errorMessage,
        variant: "destructive",
        action: <AlertTriangle className="text-white"/>,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    form.reset({ currentRoute: '', origin: selectedOrigin?.id || '', destination: selectedDestination?.id || '' });
    setAiResult(null);
    setAiError(null);
  }, [routes, form, selectedOrigin, selectedDestination]);


  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Optimizar Ruta y Visualizar Puntos</CardTitle>
        <CardDescription>Seleccione origen/destino para verlos en el mapa y su ruta actual para obtener sugerencias de IA.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-primary" /> Origen</FormLabel>
                    <Select onValueChange={handleOriginChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un punto de origen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Ninguno</SelectItem>
                        {namedLocations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Navigation className="mr-2 h-4 w-4 text-primary" /> Destino</FormLabel>
                    <Select onValueChange={handleDestinationChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un punto de destino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Ninguno</SelectItem>
                        {namedLocations.map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="currentRoute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ruta Actual (para sugerencias IA)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione su ruta actual para optimización" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRoutes.length > 0 ? (
                        availableRoutes.map(route => (
                          <SelectItem key={route.id} value={route.name}>
                            {route.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-routes" disabled>No hay rutas abiertas disponibles</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading || availableRoutes.length === 0 || !form.getValues("currentRoute")}>
              {isLoading ? <LoadingSpinner className="mr-2" size={16} /> : <Lightbulb className="mr-2 h-4 w-4" />}
              Obtener Sugerencias de Ruta
            </Button>
          </CardFooter>
        </form>
      </Form>

      {aiResult && (
        <CardContent className="mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold mb-3 text-primary font-headline">Sugerencias de Rutas Alternativas</h3>
          <Alert variant="default" className="bg-accent/10 border-accent">
            <Lightbulb className="h-5 w-5 !text-accent" />
            <AlertTitle className="font-semibold !text-accent">Rutas Sugeridas (basadas en Ruta Actual)</AlertTitle>
            <AlertDescription className="text-accent-foreground">
              <ul className="list-disc pl-5 space-y-1 mt-2">
                {aiResult.alternativeRoutes.map((route, index) => (
                  <li key={index}>{route}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
          <div className="mt-4 p-4 bg-muted/50 rounded-md">
            <h4 className="font-semibold text-muted-foreground">Justificación:</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiResult.reasoning}</p>
          </div>
        </CardContent>
      )}

      {aiError && (
         <CardContent className="mt-6 border-t pt-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Error al obtener sugerencias</AlertTitle>
              <AlertDescription>{aiError}</AlertDescription>
            </Alert>
         </CardContent>
      )}
    </Card>
  );
}
