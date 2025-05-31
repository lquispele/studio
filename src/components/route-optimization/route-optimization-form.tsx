
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
import type { Route, CongestionData, NamedLocation, AIConceptualPath, PathGenerationResult, RouteCoordinate } from '@/lib/types';
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
  onPathGenerated: (result: PathGenerationResult) => void;
  aiConceptualPathInfo: AIConceptualPath | null; // To display current AI text
}

export function RouteOptimizationForm({
  routes,
  congestionData,
  namedLocations,
  selectedOrigin,
  setSelectedOrigin,
  selectedDestination,
  setSelectedDestination,
  onPathGenerated,
  aiConceptualPathInfo
}: RouteOptimizationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isGoogleMapsApiLoaded, setIsGoogleMapsApiLoaded] = useState(false);

  const form = useForm<RouteOptimizationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      origin: '',
      destination: '',
    },
  });

   useEffect(() => {
    if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
      setIsGoogleMapsApiLoaded(true);
    } else {
      const checkGoogleMaps = setInterval(() => {
        if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
          setIsGoogleMapsApiLoaded(true);
          clearInterval(checkGoogleMaps);
        }
      }, 500);
      return () => clearInterval(checkGoogleMaps);
    }
  }, []);


  const handleOriginChange = (locationId: string) => {
    const location = namedLocations.find(loc => loc.id === locationId) || null;
    setSelectedOrigin(location);
    form.setValue('origin', locationId);
    onPathGenerated({ conceptualPath: null, detailedMapPath: null }); 
  };

  const handleDestinationChange = (locationId: string) => {
    const location = namedLocations.find(loc => loc.id === locationId) || null;
    setSelectedDestination(location);
    form.setValue('destination', locationId);
    onPathGenerated({ conceptualPath: null, detailedMapPath: null }); 
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

    if (!isGoogleMapsApiLoaded) {
      toast({
        title: "Error de Mapa",
        description: "La API de Google Maps no está cargada. Por favor, espere o refresque la página.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setAiError(null);
    onPathGenerated({ conceptualPath: null, detailedMapPath: null });

    const blockedAdminRouteInfo = routes
      .filter(route => route.status === 'blocked')
      .map(route => ({ name: route.name, description: route.pathDescription }));

    const aiInput: SuggestAlternativeRoutesInput = {
      originCoord: selectedOrigin.coordinates,
      destinationCoord: selectedDestination.coordinates,
      blockedRouteInfo: blockedAdminRouteInfo,
      congestionData,
    };

    try {
      const aiOutput = await suggestAlternativeRoutes(aiInput);
      const conceptualPath = aiOutput.suggestedPath;

      if (!conceptualPath || conceptualPath.coordinates.length < 2) {
         throw new Error("La IA no pudo generar una ruta conceptual con suficientes puntos.");
      }
      
      const directionsService = new google.maps.DirectionsService();
      const request: google.maps.DirectionsRequest = {
        origin: conceptualPath.coordinates[0],
        destination: conceptualPath.coordinates[conceptualPath.coordinates.length - 1],
        waypoints: conceptualPath.coordinates.slice(1, -1).map(coord => ({ location: new google.maps.LatLng(coord.lat, coord.lng), stopover: true })),
        travelMode: google.maps.TravelMode.DRIVING,
      };

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result && result.routes && result.routes.length > 0) {
          const detailedMapPath = result.routes[0].overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
          onPathGenerated({ conceptualPath, detailedMapPath });
          toast({
            title: "Ruta Detallada Generada",
            description: "Google Maps ha calculado una ruta basada en la sugerencia de la IA.",
            variant: "default",
            action: <CheckCircle className="text-green-500" />,
          });
        } else {
          console.error('Google Maps Directions request failed due to ' + status);
          setAiError(`Google Maps no pudo trazar una ruta detallada (Error: ${status}). Mostrando ruta conceptual de la IA.`);
          onPathGenerated({ conceptualPath, detailedMapPath: conceptualPath.coordinates });
           toast({
            title: "Error de Google Maps Directions",
            description: `No se pudo obtener la ruta detallada (${status}). Se muestra la ruta conceptual.`,
            variant: "destructive",
          });
        }
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error optimizing route:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido al generar la ruta.';
      setAiError(errorMessage);
      onPathGenerated({ conceptualPath: null, detailedMapPath: null }); 
      toast({
        title: "Error en la Optimización",
        description: errorMessage,
        variant: "destructive",
        action: <AlertTriangle className="text-white"/>,
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    form.reset({ origin: selectedOrigin?.id || '', destination: selectedDestination?.id || '' });
    setAiError(null);
  }, [routes, selectedOrigin, selectedDestination, form, onPathGenerated]);


  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center"><RouteIcon className="mr-2 h-6 w-6 text-primary"/> Calcular Ruta con IA y Google Maps</CardTitle>
        <CardDescription>Seleccione origen y destino. La IA sugerirá waypoints estratégicos (considerando rutas bloqueadas y sus calles) y Google Maps calculará la ruta detallada.</CardDescription>
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
                        {/* Ensure value is not an empty string for "Ninguno" if that's an option */}
                        {/* <SelectItem value="none_origin_placeholder">Ninguno</SelectItem> */}
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
                        {/* <SelectItem value="none_destination_placeholder">Ninguno</SelectItem> */}
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
            <Button type="submit" disabled={isLoading || !form.formState.isValid || !isGoogleMapsApiLoaded}>
              {isLoading ? <LoadingSpinner className="mr-2" size={16} /> : <Lightbulb className="mr-2 h-4 w-4" />}
              Generar Ruta Detallada
            </Button>
          </CardFooter>
        </form>
      </Form>

      {aiConceptualPathInfo && (
        <CardContent className="mt-6 border-t pt-6">
          <h3 className="text-xl font-semibold mb-3 text-primary font-headline">Sugerencia Conceptual de la IA</h3>
          <Alert variant="default" className="bg-green-500/10 border-green-500/30">
            <Lightbulb className="h-5 w-5 !text-green-600" />
            <AlertTitle className="font-semibold !text-green-700">Descripción del Camino Sugerido por IA</AlertTitle>
            <AlertDescription className="text-green-800/90">
              <p className="mt-1">{aiConceptualPathInfo.description}</p>
            </AlertDescription>
          </Alert>
          <div className="mt-4 p-4 bg-muted/50 rounded-md">
            <h4 className="font-semibold text-muted-foreground">Justificación de la IA:</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiConceptualPathInfo.reasoning}</p>
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

    