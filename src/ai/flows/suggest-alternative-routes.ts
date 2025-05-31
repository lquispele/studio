// use server'
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
import type { RouteCoordinate, AIConceptualPath } from '@/lib/types'; // Updated to AIConceptualPath

const SuggestAlternativeRoutesInputSchema = z.object({
  originCoord: z.object({ lat: z.number(), lng: z.number() }).describe('The starting coordinates (latitude, longitude).'),
  destinationCoord: z.object({ lat: z.number(), lng: z.number() }).describe('The destination coordinates (latitude, longitude).'),
  blockedRoutes: z.array(z.string()).describe('A list of names of admin-defined routes that are currently blocked, to provide context about general area blockages.'),
  congestionData: z.record(z.number()).describe('A map of admin-defined route names to their current congestion levels (0-100). Higher numbers mean more congestion.'),
});
export type SuggestAlternativeRoutesInput = z.infer<
  typeof SuggestAlternativeRoutesInputSchema
>;

// This schema now defines the AI's conceptual path suggestion, which includes waypoints.
const AIConceptualPathSchema = z.object({
  description: z.string().describe('A textual description of the suggested route from origin to destination.'),
  coordinates: z.array(z.object({ lat: z.number(), lng: z.number() })).describe('An array of latitude/longitude objects representing key waypoints of the suggested drivable path. This path should be traceable on a map by Google Directions. Provide at least 2 points (origin and destination), ideally more for a representative path.'),
  reasoning: z.string().describe('Explanation of why this route was chosen, considering blockages and congestion.'),
});
// Exporting AIConceptualPath type from lib/types.ts, so no need to redefine here.

const SuggestAlternativeRoutesOutputSchema = z.object({
  suggestedPath: AIConceptualPathSchema, // Output is the AI's conceptual path
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
- The following admin-defined routes are currently blocked and should be avoided if possible: {{#if blockedRoutes}}{{#each blockedRoutes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}.
- Current congestion on admin-defined routes (0-100, higher is worse): {{#if congestionData}}{{#each congestionData}}{{{@key}}}: {{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}No congestion data available{{/if}}.

Task:
1.  Suggest a plausible, conceptual drivable route from the origin to the destination within Tacna, Peru.
2.  The route should strategically avoid areas indicated by the 'blockedRoutes' list and try to minimize travel through highly congested admin-defined routes.
3.  Provide a textual description of this conceptual path (e.g., "Take Av. Principal, pass near Plaza Vea, then head towards Av. Sol...").
4.  Provide a list of key latitude/longitude coordinates that represent this conceptual path, suitable as waypoints for Google Maps Directions API.
    - Include the origin and destination as the first and last points respectively in this 'coordinates' array.
    - Add intermediate waypoints (1-5 points typically, more if very complex) to reasonably represent the path's shape and guide Google Maps around obstacles. Ensure these coordinates are geographically sensible for Tacna.
    - The 'coordinates' array MUST contain at least two points (origin and destination).
5.  Explain your reasoning for choosing this path, especially how you considered blockages and congestion.

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
      // If only origin is provided, or no coords at all, ensure destination is also added to make 2 points
      if (input.destinationCoord) {
        if (fallbackCoordinates.length === 0) fallbackCoordinates.push(input.originCoord); // Add origin if missing
        fallbackCoordinates.push(input.destinationCoord);
      }
      
      // Ensure at least two points, even if they are the same, to prevent crashes downstream
      if (fallbackCoordinates.length === 0) {
        fallbackCoordinates.push({lat:0,lng:0}, {lat:0,lng:0});
      } else if (fallbackCoordinates.length === 1) {
         fallbackCoordinates.push(fallbackCoordinates[0]); // Duplicate if only one point
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
