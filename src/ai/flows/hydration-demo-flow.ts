'use server';
/**
 * @fileOverview A simple AI flow for the hydration demo.
 *
 * - getSimpleResponse - A function that takes a prompt and returns a simple AI-generated response.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const HydrationDemoInputSchema = z.object({
  prompt: z.string().describe('The user prompt.'),
});
export type HydrationDemoInput = z.infer<typeof HydrationDemoInputSchema>;

const HydrationDemoOutputSchema = z.object({
  response: z.string().describe('The AI-generated response.'),
});
export type HydrationDemoOutput = z.infer<typeof HydrationDemoOutputSchema>;

export async function getSimpleResponse(
  input: HydrationDemoInput
): Promise<HydrationDemoOutput> {
  return hydrationDemoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'hydrationDemoPrompt',
  input: {schema: HydrationDemoInputSchema},
  output: {schema: HydrationDemoOutputSchema},
  model: googleAI.model('gemini-1.5-flash-latest'),
  prompt: `You are a helpful assistant. The user said: {{{prompt}}}. Respond briefly.`,
});

const hydrationDemoFlow = ai.defineFlow(
  {
    name: 'hydrationDemoFlow',
    inputSchema: HydrationDemoInputSchema,
    outputSchema: HydrationDemoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
