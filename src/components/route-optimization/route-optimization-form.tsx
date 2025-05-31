
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
import type { Route, CongestionData, NamedLocation, AISuggestedPath } from '@/lib/types';
import { Lightbulb, AlertTriangle, CheckCircle, MapPin, Navigation, RouteIcon } from 'lucide-react';

const formSchema = z.object({
  origin: z.string().min(1, "Por favor, seleccione un origen."),
  destination: z.string().min(1, "Por favor, seleccione un destino."),
});

type RouteOptimizationFormValues = z.infer<typeof formSchema>;

interface RouteOptimizationFormProps {
  routes: Route[]; // Admin-defined routes
  congestionData: CongestionData;
  namedLocations: NamedLocation[];
  selectedOrigin: NamedLocation | null;
  setSelectedOrigin: (location: NamedLocation | null) => void;
  selectedDestination: NamedLocation | null;
  setSelectedDestination: (location: NamedLocation | null) => void;
  onOptimizationResult: (result: AISuggestedPath | null) => void;
}

const NONE_VALUE = "__NONE__";

export function RouteOptimizationForm({
  routes,
  congestionData,
  namedLocations,
  selectedOrigin,
  setSelectedOrigin,
  selectedDestination,
  setSelectedDestination,
  onOptimizationResult
}: RouteOptimizationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AISuggestedPath | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<RouteOptimizationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: '',
      destination: '',
    },
  });

  const handleOriginChange = (locationId: string) => {
    const location = namedLocations.find(loc => loc.id === locationId) || null;
    setSelectedOrigin(location);
    form.setValue('origin', locationId);
    onOptimizationResult(null); // Clear previous AI path
  };

  const handleDestinationChange = (locationId: string) => {
    const location = namedLocations.find(loc => loc.id === locationId) || null;
    setSelectedDestination(location);
    form.setValue('destination', locationId);
    onOptimizationResult(null); // Clear previous AI path
  };

  useEffect(() => {
    form.setValue('origin', selectedOrigin?.id || '');
    form.setValue('destination', selectedDestination?.id || '');
  }, [selectedOrigin, selectedDestination, form]);

  const onSubmit: SubmitHandler<RouteOptimizationFormValues> = async (data) => {
    if (!selectedOrigin || !selectedDestination) {
      toast({
        title: "Selección Incompleta",
        description: "Por favor, seleccione tanto un origen como un destino.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAiResult(null);
    setAiError(null);
    onOptimizationResult(null);

    const blockedAdminRoutes = routes.filter(route => route.status === 'blocked').map(route => route.name);

    const input: SuggestAlternativeRoutesInput = {
      originCoord: selectedOrigin.coordinates,
      destinationCoord: selectedDestination.coordinates,
      blockedRoutes: blockedAdminRoutes,
      congestionData,
    };

    try {
      const result = await suggestAlternativeRoutes(input);
      if (result.suggestedPath.coordinates.length < 2) {
         throw new Error("La IA no pudo generar una ruta con suficientes puntos. Intente con otros puntos o revise la configuración de la IA.");
      }
      setAiResult(result.suggestedPath);
      onOptimizationResult(result.suggestedPath);
      toast({
        title: "Sugerencia de Ruta Generada",
        description: "Se ha generado una ruta desde su origen a su destino.",
        variant: "default",
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (error) {
      console.error('Error optimizing route:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido al generar la ruta.';
      setAiError(errorMessage);
      onOptimizationResult(null);
      toast({
        title: "Error en la Optimización",
        description: errorMessage,
        variant: "destructive",
        action: <AlertTriangle className="text-white"/>,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Reset form and AI results if admin routes change
    form.reset({ origin: selectedOrigin?.id || '', destination: selectedDestination?.id || '' });
    setAiResult(null);
    setAiError(null);
    onOptimizationResult(null);
  }, [routes, form, selectedOrigin, selectedDestination, onOptimizationResult]);


  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center"><RouteIcon className="mr-2 h-6 w-6 text-primary"/> Calcular Ruta con IA</CardTitle>
        <CardDescription>Seleccione origen y destino para que la IA genere una ruta, considerando bloqueos y congestión de rutas administrables.</CardDescription>
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
                    <Select onValueChange={handleOriginChange} value={field.value || undefined} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un punto de origen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <Select onValueChange={handleDestinationChange} value={field.value || undefined} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un punto de destino" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading || !form.formState.isValid}>
              {isLoading ? <LoadingSpinner className="mr-2" size={16} /> : <Lightbulb className="mr-2 h-4 w-4" />}
              Generar Ruta Sugerida por IA
            </Button>
          </CardFooter>
        </form>
      </Form>

      {aiResult && (
        <CardContent className="mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold mb-3 text-primary font-headline">Ruta Sugerida por IA</h3>
          <Alert variant="default" className="bg-green-500/10 border-green-500/30">
            <Lightbulb className="h-5 w-5 !text-green-600" />
            <AlertTitle className="font-semibold !text-green-700">Camino Sugerido</AlertTitle>
            <AlertDescription className="text-green-800/90">
              <p className="mt-1">{aiResult.description}</p>
            </AlertDescription>
          </Alert>
          <div className="mt-4 p-4 bg-muted/50 rounded-md">
            <h4 className="font-semibold text-muted-foreground">Justificación de la IA:</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiResult.reasoning}</p>
          </div>
        </CardContent>
      )}

      {aiError && (
         <CardContent className="mt-6 border-t pt-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle>Error al obtener sugerencia de ruta</AlertTitle>
              <AlertDescription>{aiError}</AlertDescription>
            </Alert>
         </CardContent>
      )}
    </Card>
  );
}
