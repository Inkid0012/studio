
'use server';

/**
 * @fileOverview A flow for moderating images to prevent sharing of contact info.
 *
 * - moderateImage - A function that checks if an image contains numbers.
 * - ModerateImageInput - The input type for the moderateImage function.
 * - ModerateImageOutput - The return type for the moderateImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ModerateImageInputSchema = z.object({
  photoDataUri: z.string().describe(
      "A photo to be analyzed for sensitive content, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ModerateImageInput = z.infer<typeof ModerateImageInputSchema>;

const ModerateImageOutputSchema = z.object({
  isBlocked: z.boolean().describe("Whether the image should be blocked."),
  reason: z.string().optional().describe("The reason why the image was blocked."),
});
export type ModerateImageOutput = z.infer<typeof ModerateImageOutputSchema>;

export async function moderateImage(input: ModerateImageInput): Promise<ModerateImageOutput> {
  return moderateImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateImagePrompt',
  input: { schema: ModerateImageInputSchema },
  output: { schema: ModerateImageOutputSchema },
  prompt: `You are a strict content moderator for a dating app. Your task is to detect if an image contains any visible digits or numbers. This is to prevent users from sharing phone numbers or other contact information through images.

  Analyze the following image. The image should be blocked if it contains any sequence of numbers or standalone digits.

  If the image should be blocked, set isBlocked to true and provide a brief reason (e.g., "Image contains numbers"). Otherwise, set isBlocked to false.

  Image to analyze:
  {{media url=photoDataUri}}
  `,
});

const moderateImageFlow = ai.defineFlow(
  {
    name: 'moderateImageFlow',
    inputSchema: ModerateImageInputSchema,
    outputSchema: ModerateImageOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
