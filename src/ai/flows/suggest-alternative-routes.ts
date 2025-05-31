
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting a drivable route between an origin and a destination.
 *
 * - suggestAlternativeRoutes - A function that suggests a route.
 * - SuggestAlternativeRoutesInput - The input type for the suggestAlternativeRoutes function.
 * - SuggestAlternativeRoutesOutput - The return type for the suggestAlternativeRoutes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { RouteCoordinate, AIConceptualPath } from '@/lib/types';

const SuggestAlternativeRoutesInputSchema = z.object({
  originCoord: z.object({ lat: z.number(), lng: z.number() }).describe('The starting coordinates (latitude, longitude).'),
  destinationCoord: z.object({ lat: z.number(), lng: z.number() }).describe('The destination coordinates (latitude, longitude).'),
  blockedRouteInfo: z.array(
    z.object({
      name: z.string().describe('The name of the blocked admin-defined route.'),
      description: z.string().describe('The textual path description of the blocked route (e.g., main streets it covers).')
    })
  ).describe('Information about admin-defined routes that are currently blocked. Used to understand areas to avoid.'),
  congestionData: z.record(z.number()).describe('A map of admin-defined route names to their current congestion levels (0-100). Higher numbers mean more congestion.'),
});
export type SuggestAlternativeRoutesInput = z.infer<
  typeof SuggestAlternativeRoutesInputSchema
>;

const AIConceptualPathSchema = z.object({
  description: z.string().describe('A textual description of the suggested route from origin to destination, mentioning street names where possible.'),
  coordinates: z.array(z.object({ lat: z.number(), lng: z.number() })).describe('An array of latitude/longitude objects representing key waypoints of the suggested drivable path. This path should be traceable on a map by Google Directions. Provide at least 2 points (origin and destination), ideally more for a representative path.'),
  reasoning: z.string().describe('Explanation of why this route was chosen, considering blockages (with their street descriptions) and congestion, and referencing street names if relevant, particularly detailing how blocked areas were circumvented.'),
});

const SuggestAlternativeRoutesOutputSchema = z.object({
  suggestedPath: AIConceptualPathSchema,
});
export type SuggestAlternativeRoutesOutput = z.infer<
  typeof SuggestAlternativeRoutesOutputSchema
>;

export async function suggestAlternativeRoutes(
  input: SuggestAlternativeRoutesInput
): Promise<SuggestAlternativeRoutesOutput> {
  return suggestAlternativeRoutesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRoutePathPrompt',
  input: {schema: SuggestAlternativeRoutesInputSchema},
  output: {schema: SuggestAlternativeRoutesOutputSchema},
  prompt: `You are an expert route planning assistant for Tacna, Peru. Your goal is to generate a single, conceptual drivable route from a given origin to a given destination, providing key waypoints. This conceptual route will then be fed into Google Maps Directions API.

User's Request:
- Origin: Latitude {{originCoord.lat}}, Longitude {{originCoord.lng}}
- Destination: Latitude {{destinationCoord.lat}}, Longitude {{destinationCoord.lng}}

Contextual Information:
- The following admin-defined routes are currently blocked. Try to route around the areas these routes cover:
  {{#if blockedRouteInfo}}
  {{#each blockedRouteInfo}}
  - Route Name: "{{name}}" (Covers: {{description}})
  {{/each}}
  {{else}}
  No routes are currently reported as blocked.
  {{/if}}
- Current congestion on admin-defined routes (0-100, higher is worse): {{#if congestionData}}{{#each congestionData}}{{{@key}}}: {{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}No congestion data available{{/if}}.

Task:
1.  Suggest a plausible, conceptual drivable route from the origin to the destination within Tacna, Peru. Aim to use known streets and avenues of Tacna where possible.
2.  The route must strategically avoid areas indicated by the 'blockedRouteInfo' (considering their names and street descriptions). It is crucial that the waypoints you provide guide a path that circumvents these blocked areas, not through any part of them. Also, try to minimize travel through highly congested admin-defined routes.
3.  Provide a textual description of this conceptual path. When possible, mention specific street names, avenues, or notable landmarks in Tacna that your suggested route would take (e.g., "Start by taking Avenida Bolognesi, then turn onto Calle San Martín...").
4.  Provide a list of key latitude/longitude coordinates that represent this conceptual path, suitable as waypoints for Google Maps Directions API.
    - Include the origin and destination as the first and last points respectively in this 'coordinates' array.
    - Add intermediate waypoints (1-5 points typically, more if very complex) to reasonably represent the path's shape and guide Google Maps around obstacles. Ensure these coordinates are geographically sensible for Tacna.
    - The 'coordinates' array MUST contain at least two points (origin and destination).
5.  Explain your reasoning for choosing this path, referencing street names or areas if relevant to how you considered congestion, and particularly detailing how your suggested path and waypoints successfully navigate around the described blocked areas.

Output Format:
Your output MUST strictly follow the JSON schema provided for 'suggestedPath'.
The 'coordinates' array must contain objects with 'lat' and 'lng' properties.
Example for coordinates: [{ "lat": -18.01, "lng": -70.25 }, { "lat": -18.012, "lng": -70.252 }, {"lat": -18.015, "lng": -70.255 }]

Please generate the conceptual route and waypoints now.
`,
});

const suggestAlternativeRoutesFlow = ai.defineFlow(
  {
    name: 'suggestRoutePathFlow',
    inputSchema: SuggestAlternativeRoutesInputSchema,
    outputSchema: SuggestAlternativeRoutesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.suggestedPath || !output.suggestedPath.coordinates || output.suggestedPath.coordinates.length < 2) {
      console.error("AI did not return a valid path with at least 2 coordinates. Input:", input);

      const fallbackCoordinates: RouteCoordinate[] = [];
      if (input.originCoord) fallbackCoordinates.push(input.originCoord);
      if (input.destinationCoord) {
         if (fallbackCoordinates.length === 0 && input.originCoord) { 
            fallbackCoordinates.push(input.originCoord);
         }
        fallbackCoordinates.push(input.destinationCoord);
      }
      
      if (fallbackCoordinates.length === 0) {
        fallbackCoordinates.push({lat:0,lng:0}, {lat:0,lng:0});
      } else if (fallbackCoordinates.length === 1) {
         fallbackCoordinates.push({...fallbackCoordinates[0]}); 
      }


      return {
        suggestedPath: {
          description: "La IA no pudo generar una ruta detallada. Se muestra una línea directa como alternativa.",
          coordinates: fallbackCoordinates,
          reasoning: "La IA no pudo generar una respuesta estructurada válida o una ruta con suficientes puntos. Por favor, verifique el modelo de IA o el prompt.",
        }
      };
    }
    return output!;
  }
);
