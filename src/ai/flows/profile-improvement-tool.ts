'use server';

/**
 * @fileOverview An AI agent that suggests profile improvements to attract more matches.
 *
 * - getProfileSuggestions - A function that provides profile improvement suggestions.
 * - ProfileImprovementInput - The input type for the getProfileSuggestions function.
 * - ProfileImprovementOutput - The return type for the getProfileSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProfileImprovementInputSchema = z.object({
  profileDescription: z
    .string()
    .describe('The current description of the user profile.'),
  desiredMatches: z
    .string()
    .describe('The type of matches the user is hoping to attract.'),
});
export type ProfileImprovementInput = z.infer<typeof ProfileImprovementInputSchema>;

const ProfileImprovementOutputSchema = z.object({
  suggestions: z
    .string()
    .describe('Suggestions on how to improve the profile to attract more matches.'),
});
export type ProfileImprovementOutput = z.infer<typeof ProfileImprovementOutputSchema>;

export async function getProfileSuggestions(
  input: ProfileImprovementInput
): Promise<ProfileImprovementOutput> {
  return profileImprovementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'profileImprovementPrompt',
  input: {schema: ProfileImprovementInputSchema},
  output: {schema: ProfileImprovementOutputSchema},
  prompt: `You are a dating profile expert. Analyze the user's current profile description and provide suggestions on how to improve it to attract more matches.

Current Profile Description: {{{profileDescription}}}
Desired Matches: {{{desiredMatches}}}

Suggestions:`,
});

const profileImprovementFlow = ai.defineFlow(
  {
    name: 'profileImprovementFlow',
    inputSchema: ProfileImprovementInputSchema,
    outputSchema: ProfileImprovementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
