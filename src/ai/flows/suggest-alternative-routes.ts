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
import type { RouteCoordinate } from '@/lib/types';

const SuggestAlternativeRoutesInputSchema = z.object({
  originCoord: z.object({ lat: z.number(), lng: z.number() }).describe('The starting coordinates (latitude, longitude).'),
  destinationCoord: z.object({ lat: z.number(), lng: z.number() }).describe('The destination coordinates (latitude, longitude).'),
  blockedRoutes: z.array(z.string()).describe('A list of names of admin-defined routes that are currently blocked, to provide context about general area blockages.'),
  congestionData: z.record(z.number()).describe('A map of admin-defined route names to their current congestion levels (0-100). Higher numbers mean more congestion.'),
});
export type SuggestAlternativeRoutesInput = z.infer<
  typeof SuggestAlternativeRoutesInputSchema
>;

const AISuggestedPathSchema = z.object({
  description: z.string().describe('A textual description of the suggested route from origin to destination.'),
  coordinates: z.array(z.object({ lat: z.number(), lng: z.number() })).describe('An array of latitude/longitude objects representing key waypoints of the suggested drivable path. This path should be traceable on a map. Provide at least 2 points (origin and destination), ideally more for a representative path.'),
  reasoning: z.string().describe('Explanation of why this route was chosen, considering blockages and congestion.'),
});
export type AISuggestedPath = z.infer<typeof AISuggestedPathSchema>;


const SuggestAlternativeRoutesOutputSchema = z.object({
  suggestedPath: AISuggestedPathSchema,
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
  prompt: `You are an expert route planning assistant for Tacna, Peru. Your goal is to generate a single, drivable route from a given origin to a given destination.

User's Request:
- Origin: Latitude {{originCoord.lat}}, Longitude {{originCoord.lng}}
- Destination: Latitude {{destinationCoord.lat}}, Longitude {{destinationCoord.lng}}

Contextual Information:
- The following admin-defined routes are currently blocked and should be avoided if possible: {{#if blockedRoutes}}{{#each blockedRoutes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}.
- Current congestion on admin-defined routes (0-100, higher is worse): {{#if congestionData}}{{#each congestionData}}{{{@key}}}: {{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}No congestion data available{{/if}}.

Task:
1.  Suggest a plausible, drivable route from the origin to the destination within Tacna, Peru.
2.  The route should avoid blocked areas indicated by the 'blockedRoutes' list and try to minimize travel through highly congested admin-defined routes.
3.  Provide a textual description of the suggested path (e.g., "Take Av. Principal, turn right on Calle Sol...").
4.  Provide a list of key latitude/longitude coordinates that represent this path, suitable for tracing on a map. Include the origin and destination as the first and last points. Add intermediate waypoints to reasonably represent the path's shape. Aim for 5-10 points if the route is complex, fewer if it's simple. Ensure these coordinates are geographically sensible for Tacna.
5.  Explain your reasoning for choosing this path, especially how you considered blockages and congestion.

Output Format:
Your output MUST strictly follow the JSON schema provided for 'suggestedPath'.
The 'coordinates' array must contain objects with 'lat' and 'lng' properties.
Example for coordinates: [{ "lat": -18.01, "lng": -70.25 }, { "lat": -18.012, "lng": -70.252 }, {"lat": -18.015, "lng": -70.255 }]

Please generate the route now.
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
      // Fallback or error handling if AI output is not as expected
      // For simplicity, returning a default path or throwing an error
      console.error("AI did not return a valid path with at least 2 coordinates. Input:", input);

      // Construct a direct line as a fallback if coordinates are too few
      const fallbackCoordinates: RouteCoordinate[] = [];
      if (input.originCoord) fallbackCoordinates.push(input.originCoord);
      if (input.destinationCoord) fallbackCoordinates.push(input.destinationCoord);
      
      if (fallbackCoordinates.length < 2 && fallbackCoordinates.length > 0) { // if only one point, duplicate it
         fallbackCoordinates.push(fallbackCoordinates[0]);
      }


      return {
        suggestedPath: {
          description: "Could not generate a detailed route. Displaying a direct line as fallback.",
          coordinates: fallbackCoordinates.length >=2 ? fallbackCoordinates : [{lat:0,lng:0}, {lat:0,lng:0}], // Ensure at least two points for polyline
          reasoning: "AI failed to generate a valid structured response or path with sufficient points. Please check AI model or prompt.",
        }
      };
    }
    return output!;
  }
);
