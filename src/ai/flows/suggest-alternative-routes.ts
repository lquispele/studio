// use server'
'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting alternative routes based on blocked routes and congestion.
 *
 * - suggestAlternativeRoutes - A function that suggests alternative routes.
 * - SuggestAlternativeRoutesInput - The input type for the suggestAlternativeRoutes function.
 * - SuggestAlternativeRoutesOutput - The return type for the suggestAlternativeRoutes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAlternativeRoutesInputSchema = z.object({
  currentRoute: z.string().describe('The current route the driver is planning to take.'),
  blockedRoutes: z.array(z.string()).describe('A list of routes that are currently blocked.'),
  congestionData: z.record(z.number()).describe('A map of route names to congestion levels (0-100).'),
});
export type SuggestAlternativeRoutesInput = z.infer<
  typeof SuggestAlternativeRoutesInputSchema
>;

const SuggestAlternativeRoutesOutputSchema = z.object({
  alternativeRoutes: z
    .array(z.string())
    .describe('A list of suggested alternative routes, ordered by estimated travel time (shortest first).'),
  reasoning: z.string().describe('Explanation of why those routes were chosen.'),
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
  name: 'suggestAlternativeRoutesPrompt',
  input: {schema: SuggestAlternativeRoutesInputSchema},
  output: {schema: SuggestAlternativeRoutesOutputSchema},
  prompt: `You are a route optimization expert for Tacna, Peru.

Given the driver's current route: {{{currentRoute}}},
the following routes are currently blocked: {{#each blockedRoutes}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
and current congestion data: {{#each congestionData}}{{{@key}}}: {{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

Please suggest alternative routes that avoid the blocked routes and minimize congestion.
Consider that routes with higher congestion numbers should be avoided.

Provide a list of alternative routes, ordered by estimated travel time (shortest first), as well as a brief explanation of why those routes were chosen.
Ensure the route starts and ends at same location.

Output:
{{output}}
`,
});

const suggestAlternativeRoutesFlow = ai.defineFlow(
  {
    name: 'suggestAlternativeRoutesFlow',
    inputSchema: SuggestAlternativeRoutesInputSchema,
    outputSchema: SuggestAlternativeRoutesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
