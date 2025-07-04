
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { suggestAlternativeRoutes, type SuggestAlternativeRoutesInput } from '@/ai/flows/suggest-alternative-routes';
import type { Route, CongestionData, NamedLocation, AIConceptualPath, PathGenerationResult, RouteCoordinate } from '@/lib/types';
import { Lightbulb, AlertTriangle, CheckCircle, MapPin, Navigation, RouteIcon, Search } from 'lucide-react';

const formSchema = z.object({
  originText: z.string().min(3, "Por favor, ingrese un origen (mínimo 3 caracteres)."),
  destinationText: z.string().min(3, "Por favor, ingrese un destino (mínimo 3 caracteres)."),
});

type RouteOptimizationFormValues = z.infer<typeof formSchema>;

interface RouteOptimizationFormProps {
  routes: Route[];
  congestionData: CongestionData;
  namedLocations: NamedLocation[]; // Kept for potential future use by form
  
  selectedOrigin: RouteCoordinate | null;
  setSelectedOrigin: (location: RouteCoordinate | null) => void;
  selectedDestination: RouteCoordinate | null;
  setSelectedDestination: (location: RouteCoordinate | null) => void;

  onPathGenerated: (result: PathGenerationResult) => void;
  aiConceptualPathInfo: AIConceptualPath | null;
}

export function RouteOptimizationForm({
  routes,
  congestionData,
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

  const originInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const originAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);


  const form = useForm<RouteOptimizationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originText: '',
      destinationText: '',
    },
  });

   useEffect(() => {
    if (typeof window.google !== 'undefined' && 
        typeof window.google.maps !== 'undefined' && 
        typeof window.google.maps.places !== 'undefined' &&
        typeof window.google.maps.Geocoder !== 'undefined' &&
        typeof window.google.maps.DirectionsService !== 'undefined'
        ) {
      setIsGoogleMapsApiLoaded(true);
    } else {
      // Check periodically if Google Maps API (including places) is loaded
      const intervalId = setInterval(() => {
        if (typeof window.google !== 'undefined' && 
            typeof window.google.maps !== 'undefined' && 
            typeof window.google.maps.places !== 'undefined' &&
            typeof window.google.maps.Geocoder !== 'undefined' &&
            typeof window.google.maps.DirectionsService !== 'undefined'
        ) {
          setIsGoogleMapsApiLoaded(true);
          clearInterval(intervalId);
        }
      }, 500);
      return () => clearInterval(intervalId);
    }
  }, []);

  useEffect(() => {
    if (!isGoogleMapsApiLoaded || !originInputRef.current || !destinationInputRef.current) return;

    const tacnaBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-18.2, -70.4), // Southwest
      new google.maps.LatLng(-17.8, -70.0)  // Northeast
    );

    const autocompleteOptions: google.maps.places.AutocompleteOptions = {
      bounds: tacnaBounds,
      componentRestrictions: { country: 'PE' }, // Restrict to Peru
      fields: ['geometry.location', 'name', 'formatted_address'],
      strictBounds: false, // Be a bit flexible if user types something slightly outside
    };

    // Initialize Origin Autocomplete
    if (!originAutocompleteRef.current && originInputRef.current) {
        originAutocompleteRef.current = new google.maps.places.Autocomplete(originInputRef.current, autocompleteOptions);
        originAutocompleteRef.current.addListener('place_changed', () => {
        const place = originAutocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          setSelectedOrigin({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
          form.setValue('originText', place.formatted_address || place.name || '', { shouldValidate: true });
          onPathGenerated({ conceptualPath: null, detailedMapPath: null }); // Clear old path
          setAiError(null);
        } else {
            // Don't clear setSelectedOrigin here if user types something invalid after selecting a valid place
            // Only show toast if place is truly not found by autocomplete selection
            // This case (no geometry.location) is less common for a 'place_changed' event if a suggestion was clicked
             if(form.getValues('originText')){ // if there's text, but no valid place selected
                toast({title: "Origen no geocodificado", description: "Por favor, seleccione un lugar válido de la lista para el origen o verifique la dirección.", variant:"default"});
             }
        }
      });
    }

    // Initialize Destination Autocomplete
    if (!destinationAutocompleteRef.current && destinationInputRef.current) {
        destinationAutocompleteRef.current = new google.maps.places.Autocomplete(destinationInputRef.current, autocompleteOptions);
        destinationAutocompleteRef.current.addListener('place_changed', () => {
        const place = destinationAutocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          setSelectedDestination({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
          form.setValue('destinationText', place.formatted_address || place.name || '', { shouldValidate: true });
          onPathGenerated({ conceptualPath: null, detailedMapPath: null }); // Clear old path
          setAiError(null);
        } else {
            if(form.getValues('destinationText')){
                 toast({title: "Destino no geocodificado", description: "Por favor, seleccione un lugar válido de la lista para el destino o verifique la dirección.", variant:"default"});
            }
        }
      });
    }
  }, [isGoogleMapsApiLoaded, setSelectedOrigin, setSelectedDestination, form, onPathGenerated, toast]);


  // Effect to clear conceptual path if text inputs are manually changed *after* a selection was made
  // This is mainly for clearing the AI's textual output if inputs change
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change') { 
        onPathGenerated({ conceptualPath: null, detailedMapPath: null });
        setAiError(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onPathGenerated]);


  const geocodeAddress = async (address: string): Promise<RouteCoordinate | null> => {
    if (!isGoogleMapsApiLoaded || typeof google === 'undefined' || !google.maps.Geocoder) {
      toast({ title: "Error", description: "API de Google Geocoding no está lista.", variant: "destructive" });
      return null;
    }
    const geocoder = new google.maps.Geocoder();
    const tacnaBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-18.2, -70.4),
      new google.maps.LatLng(-17.8, -70.0)
    );
    try {
      const results = await geocoder.geocode({ address: address + ", Tacna, Peru", bounds: tacnaBounds, region: 'PE' });
      if (results && results.results[0] && results.results[0].geometry) {
        const location = results.results[0].geometry.location;
        return { lat: location.lat(), lng: location.lng() };
      } else {
        toast({ title: "Error de Geocodificación", description: `No se pudo encontrar "${address}". Por favor, intente una dirección más específica o seleccione de las sugerencias.`, variant: "destructive" });
        return null;
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      const status = (error as any).code || (error as any).status; // Geocoder often returns status in error
      toast({ title: "Error de Geocodificación", description: `Fallo para "${address}": ${status || 'Error desconocido'}.`, variant: "destructive" });
      return null;
    }
  };


  const onSubmit: SubmitHandler<RouteOptimizationFormValues> = async (data) => {
    if (!isGoogleMapsApiLoaded) {
      toast({ title: "Error de Mapa", description: "API de Google Maps no está completamente cargada.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setAiError(null);
    onPathGenerated({ conceptualPath: null, detailedMapPath: null }); // Clear previous path before new generation

    let originForAI: RouteCoordinate | null = selectedOrigin;
    let destinationForAI: RouteCoordinate | null = selectedDestination;

    // If origin/destination not set by Autocomplete, try to geocode the text input
    if (!originForAI && data.originText) {
      toast({ title: "Geocodificando Origen...", description: data.originText, duration: 2000 });
      originForAI = await geocodeAddress(data.originText);
      if (originForAI) setSelectedOrigin(originForAI); else {
        setIsLoading(false); return;
      }
    }
    if (!destinationForAI && data.destinationText) {
      toast({ title: "Geocodificando Destino...", description: data.destinationText, duration: 2000 });
      destinationForAI = await geocodeAddress(data.destinationText);
      if (destinationForAI) setSelectedDestination(destinationForAI); else {
        setIsLoading(false); return;
      }
    }
    
    if (!originForAI || !destinationForAI) {
       toast({ title: "Error de Coordenadas", description: "Origen y/o destino no son válidos o no pudieron ser geocodificados. Por favor, selecciónelos de las sugerencias o ingrese direcciones válidas.", variant: "destructive" });
       setIsLoading(false);
       return;
    }

    const blockedAdminRouteInfo = routes
      .filter(route => route.status === 'blocked')
      .map(route => ({ name: route.name, description: route.pathDescription }));

    const aiInput: SuggestAlternativeRoutesInput = {
      originCoord: originForAI,
      destinationCoord: destinationForAI,
      blockedRouteInfo: blockedAdminRouteInfo,
      congestionData,
    };

    try {
      toast({ title: "Consultando IA para ruta conceptual...", variant: "default", duration: 3000});
      const aiOutput = await suggestAlternativeRoutes(aiInput);
      const conceptualPath = aiOutput.suggestedPath;

      if (!conceptualPath || conceptualPath.coordinates.length < 2) {
         // Set AI error, but still provide the direct line for map path if possible
        const directPathForMap = (originForAI && destinationForAI) ? [originForAI, destinationForAI] : null;
        onPathGenerated({ conceptualPath: null, detailedMapPath: directPathForMap});
        throw new Error("La IA no pudo generar una ruta conceptual con suficientes puntos. Se muestra una línea directa si es posible.");
      }
      
      toast({ title: "IA sugirió waypoints. Obteniendo ruta detallada de Google Maps...", variant: "default", duration: 3000});
      if (!google.maps.DirectionsService) {
        throw new Error("Google Maps Directions Service no está disponible.");
      }
      const directionsService = new google.maps.DirectionsService();
      const request: google.maps.DirectionsRequest = {
        origin: conceptualPath.coordinates[0],
        destination: conceptualPath.coordinates[conceptualPath.coordinates.length - 1],
        waypoints: conceptualPath.coordinates.slice(1, -1).map(coord => ({ location: new google.maps.LatLng(coord.lat, coord.lng), stopover: true })),
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
      };

      const result = await new Promise<google.maps.DirectionsResult | null>((resolve, reject) => {
         directionsService.route(request, (res, status) => {
          if (status === google.maps.DirectionsStatus.OK && res) {
            resolve(res);
          } else {
            console.error('Google Maps Directions request failed: ' + status, res);
            reject(new Error(`Google Maps no pudo trazar una ruta detallada con los waypoints de la IA (Error: ${status}). Se mostrará la ruta conceptual de la IA si está disponible.`));
          }
        });
      });
      
      if (result && result.routes && result.routes.length > 0) {
          const detailedMapPath = result.routes[0].overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
          onPathGenerated({ conceptualPath, detailedMapPath }); // Pass both
          toast({
            title: "Ruta Detallada Generada",
            description: "Google Maps ha calculado una ruta basada en la sugerencia de la IA.",
            variant: "default",
          });
        } else {
          // This case should ideally be caught by the promise rejection, but as a fallback:
          throw new Error("Google Maps no devolvió una ruta válida. Se mostrará la ruta conceptual de la IA si está disponible.");
        }

    } catch (error) {
      console.error('Error optimizing route:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido al generar la ruta.';
      setAiError(errorMessage);
      // Fallback to AI conceptual path for drawing if Directions API failed but AI provided something
      // or if the initial AI error occurred but we have origin/destination
      const fallbackPath = (aiConceptualPathInfo && aiConceptualPathInfo.coordinates.length >=2) 
          ? aiConceptualPathInfo.coordinates 
          : (originForAI && destinationForAI ? [originForAI, destinationForAI] : null); // Direct line as last resort

      onPathGenerated({ 
          conceptualPath: (error instanceof Error && error.message.includes("IA no pudo")) ? null : aiConceptualPathInfo, // Keep AI text if error was from Google Maps
          detailedMapPath: fallbackPath
      });
      toast({
        title: "Error en la Optimización",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (!isGoogleMapsApiLoaded) return;
    form.reset({ originText: '', destinationText: '' });
    setSelectedOrigin(null);
    setSelectedDestination(null);
    onPathGenerated({ conceptualPath: null, detailedMapPath: null });
    setAiError(null);
  }, [routes, isGoogleMapsApiLoaded]); // Removed form, setSelectedOrigin etc to prevent loop, page load handles reset if routes change.


  const canSubmit = isGoogleMapsApiLoaded && 
                    (selectedOrigin || form.getValues('originText').length >=3) && 
                    (selectedDestination || form.getValues('destinationText').length >=3) && 
                    !isLoading;

  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center"><RouteIcon className="mr-2 h-6 w-6 text-primary"/> Calcular Ruta con IA y Google Maps</CardTitle>
        <CardDescription>Ingrese origen y destino (con autocompletado). La IA sugerirá waypoints estratégicos (evitando rutas bloqueadas) y Google Maps calculará la ruta detallada.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="originText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-primary" /> Origen (Ej: Av. Coronel Mendoza, Tacna)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ingrese dirección o lugar de origen" 
                        {...field} 
                        ref={originInputRef} 
                        onChange={(e) => {
                            field.onChange(e); // RHF's onChange
                            if (!e.target.value) { // If input is manually cleared
                                setSelectedOrigin(null);
                                // onPathGenerated({ conceptualPath: null, detailedMapPath: null }); // Clearing path is handled by form.watch
                            }
                        }}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destinationText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Navigation className="mr-2 h-4 w-4 text-primary" /> Destino (Ej: UNJBG, Tacna)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ingrese dirección o lugar de destino" 
                        {...field} 
                        ref={destinationInputRef} 
                        onChange={(e) => {
                            field.onChange(e); // RHF's onChange
                             if (!e.target.value) { // If input is manually cleared
                                setSelectedDestination(null);
                                // onPathGenerated({ conceptualPath: null, detailedMapPath: null }); // Clearing path is handled by form.watch
                            }
                        }}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             {!isGoogleMapsApiLoaded && (
                <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/30">
                    <AlertTriangle className="h-5 w-5 !text-yellow-600" />
                    <AlertTitle className="!text-yellow-700">Cargando API de Google Maps...</AlertTitle>
                    <AlertDescription className="text-yellow-800/90">
                        El autocompletado y la generación de rutas se activarán en breve.
                    </AlertDescription>
                </Alert>
             )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={!canSubmit}>
              {isLoading ? <LoadingSpinner className="mr-2" size={16} /> : <Search className="mr-2 h-4 w-4" />}
              {isLoading ? "Generando Ruta..." : "Buscar y Generar Ruta"}
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
              <AlertTitle>Error al procesar la ruta</AlertTitle>
              <AlertDescription>{aiError}</AlertDescription>
            </Alert>
         </CardContent>
      )}
    </Card>
  );

    