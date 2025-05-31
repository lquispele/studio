
'use client';

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input'; // Changed from Select
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { suggestAlternativeRoutes, type SuggestAlternativeRoutesInput } from '@/ai/flows/suggest-alternative-routes';
import type { Route, CongestionData, NamedLocation, AIConceptualPath, PathGenerationResult, RouteCoordinate } from '@/lib/types';
import { Lightbulb, AlertTriangle, CheckCircle, MapPin, Navigation, RouteIcon, Search } from 'lucide-react';

// Updated form schema for text inputs
const formSchema = z.object({
  originText: z.string().min(3, "Por favor, ingrese un origen (mínimo 3 caracteres)."),
  destinationText: z.string().min(3, "Por favor, ingrese un destino (mínimo 3 caracteres)."),
});

type RouteOptimizationFormValues = z.infer<typeof formSchema>;

interface RouteOptimizationFormProps {
  routes: Route[]; // Admin-defined routes
  congestionData: CongestionData;
  // namedLocations is kept for potential future use, but not for O/D selection anymore
  namedLocations: NamedLocation[]; 
  
  // These will now be updated with geocoded coordinates
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
  // namedLocations, // Not directly used for O/D selection in this version
  selectedOrigin,
  setSelectedOrigin,
  selectedDestination,
  setSelectedDestination,
  onPathGenerated,
  aiConceptualPathInfo
}: RouteOptimizationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isGoogleMapsApiLoaded, setIsGoogleMapsApiLoaded] = useState(false);

  const form = useForm<RouteOptimizationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      originText: '',
      destinationText: '',
    },
  });

   useEffect(() => {
    if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined' && typeof window.google.maps.Geocoder !== 'undefined') {
      setIsGoogleMapsApiLoaded(true);
    } else {
      const checkGoogleMaps = setInterval(() => {
        if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined' && typeof window.google.maps.Geocoder !== 'undefined') {
          setIsGoogleMapsApiLoaded(true);
          clearInterval(checkGoogleMaps);
        }
      }, 500);
      return () => clearInterval(checkGoogleMaps);
    }
  }, []);

  // Effect to clear paths if text inputs change significantly (or on manual clear)
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if ((name === 'originText' || name === 'destinationText') && type === 'change') {
        setSelectedOrigin(null);
        setSelectedDestination(null);
        onPathGenerated({ conceptualPath: null, detailedMapPath: null });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, setSelectedOrigin, setSelectedDestination, onPathGenerated]);


  const geocodeAddress = (address: string): Promise<RouteCoordinate> => {
    return new Promise((resolve, reject) => {
      if (!isGoogleMapsApiLoaded || typeof google === 'undefined') {
        reject(new Error("Google Maps API no está cargada."));
        return;
      }
      const geocoder = new google.maps.Geocoder();
      // Bias geocoding to Tacna, Peru region
      const tacnaBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(-18.2, -70.4), // Southwest corner of Tacna region
        new google.maps.LatLng(-17.8, -70.0)  // Northeast corner of Tacna region
      );
      geocoder.geocode({ address: address, bounds: tacnaBounds, region: 'PE' }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          reject(new Error(`Geocoding falló para "${address}": ${status}`));
        }
      });
    });
  };


  const onSubmit: SubmitHandler<RouteOptimizationFormValues> = async (data) => {
    if (!isGoogleMapsApiLoaded) {
      toast({
        title: "Error de Mapa",
        description: "La API de Google Maps (Geocoding) no está cargada. Por favor, espere o refresque la página.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setIsGeocoding(true);
    setAiError(null);
    onPathGenerated({ conceptualPath: null, detailedMapPath: null });
    setSelectedOrigin(null); // Clear previous markers
    setSelectedDestination(null);

    let originCoords: RouteCoordinate | null = null;
    let destinationCoords: RouteCoordinate | null = null;

    try {
      toast({ title: "Geocodificando Origen...", description: data.originText });
      originCoords = await geocodeAddress(data.originText + ", Tacna, Peru"); // Add ", Tacna, Peru" for better accuracy
      setSelectedOrigin(originCoords);
      toast({ title: "Origen Encontrado", description: `Lat: ${originCoords.lat.toFixed(4)}, Lng: ${originCoords.lng.toFixed(4)}`, variant: "default" });

      toast({ title: "Geocodificando Destino...", description: data.destinationText });
      destinationCoords = await geocodeAddress(data.destinationText + ", Tacna, Peru"); // Add ", Tacna, Peru" for better accuracy
      setSelectedDestination(destinationCoords);
      toast({ title: "Destino Encontrado", description: `Lat: ${destinationCoords.lat.toFixed(4)}, Lng: ${destinationCoords.lng.toFixed(4)}`, variant: "default" });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido durante la geocodificación.";
      toast({ title: "Error de Geocodificación", description: errorMessage, variant: "destructive" });
      setAiError(errorMessage);
      setIsLoading(false);
      setIsGeocoding(false);
      return;
    }
    setIsGeocoding(false);

    if (!originCoords || !destinationCoords) {
       toast({ title: "Error", description: "No se pudieron obtener coordenadas para origen y/o destino.", variant: "destructive" });
       setIsLoading(false);
       return;
    }

    const blockedAdminRouteInfo = routes
      .filter(route => route.status === 'blocked')
      .map(route => ({ name: route.name, description: route.pathDescription }));

    const aiInput: SuggestAlternativeRoutesInput = {
      originCoord: originCoords,
      destinationCoord: destinationCoords,
      blockedRouteInfo: blockedAdminRouteInfo,
      congestionData,
    };

    try {
      toast({ title: "Consultando IA para ruta conceptual...", variant: "default"});
      const aiOutput = await suggestAlternativeRoutes(aiInput);
      const conceptualPath = aiOutput.suggestedPath;

      if (!conceptualPath || conceptualPath.coordinates.length < 2) {
         throw new Error("La IA no pudo generar una ruta conceptual con suficientes puntos.");
      }
      
      toast({ title: "IA sugirió waypoints. Obteniendo ruta detallada de Google Maps...", variant: "default"});
      const directionsService = new google.maps.DirectionsService();
      const request: google.maps.DirectionsRequest = {
        origin: conceptualPath.coordinates[0],
        destination: conceptualPath.coordinates[conceptualPath.coordinates.length - 1],
        waypoints: conceptualPath.coordinates.slice(1, -1).map(coord => ({ location: new google.maps.LatLng(coord.lat, coord.lng), stopover: true })),
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false, // We only want one route based on AI waypoints
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
          console.error('Google Maps Directions request failed due to ' + status, result);
          setAiError(`Google Maps no pudo trazar una ruta detallada con los waypoints de la IA (Error: ${status}). Mostrando ruta conceptual de la IA.`);
          onPathGenerated({ conceptualPath, detailedMapPath: conceptualPath.coordinates }); // Fallback to AI conceptual path for drawing
           toast({
            title: "Error de Google Maps Directions",
            description: `No se pudo obtener la ruta detallada (${status}). Se muestra la ruta conceptual de la IA.`,
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
        title: "Error en la Optimización con IA",
        description: errorMessage,
        variant: "destructive",
        action: <AlertTriangle className="text-white"/>,
      });
      setIsLoading(false);
    }
  };
  
  // Reset form and clear selections if admin routes change
  useEffect(() => {
    form.reset({ originText: '', destinationText: '' });
    setSelectedOrigin(null);
    setSelectedDestination(null);
    onPathGenerated({ conceptualPath: null, detailedMapPath: null });
    setAiError(null);
  }, [routes, form, setSelectedOrigin, setSelectedDestination, onPathGenerated]);


  return (
    <Card className="shadow-lg mt-8">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center"><RouteIcon className="mr-2 h-6 w-6 text-primary"/> Calcular Ruta con IA y Google Maps</CardTitle>
        <CardDescription>Ingrese origen y destino. El sistema geocodificará las direcciones. Luego, la IA sugerirá waypoints estratégicos (considerando rutas bloqueadas y sus calles) y Google Maps calculará la ruta detallada.</CardDescription>
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
                      <Input placeholder="Ingrese dirección o lugar de origen" {...field} />
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
                      <Input placeholder="Ingrese dirección o lugar de destino" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading || isGeocoding || !isGoogleMapsApiLoaded}>
              {(isLoading || isGeocoding) ? <LoadingSpinner className="mr-2" size={16} /> : <Search className="mr-2 h-4 w-4" />}
              {(isGeocoding && !isLoading) ? "Buscando Coordenadas..." : isLoading ? "Generando Ruta..." : "Buscar y Generar Ruta"}
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
}
    

    