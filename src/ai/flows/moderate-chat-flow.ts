
'use server';

/**
 * @fileOverview A flow for moderating chat messages to prevent sharing of contact info.
 *
 * - moderateMessage - A function that checks if a message contains a phone number or other contact info.
 * - ModerateMessageInput - The input type for the moderateMessage function.
 * - ModerateMessageOutput - The return type for the moderateMessage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ModerateMessageInputSchema = z.object({
  text: z.string().describe("The chat message text to analyze."),
});
export type ModerateMessageInput = z.infer<typeof ModerateMessageInputSchema>;

const ModerateMessageOutputSchema = z.object({
  isBlocked: z.boolean().describe("Whether the message should be blocked."),
  reason: z.string().optional().describe("The reason why the message was blocked."),
});
export type ModerateMessageOutput = z.infer<typeof ModerateMessageOutputSchema>;

export async function moderateMessage(input: ModerateMessageInput): Promise<ModerateMessageOutput> {
  return moderateMessageFlow(input);
}

// This prompt is no longer used in the flow but is kept for reference.
const prompt = ai.definePrompt({
  name: 'moderateMessagePrompt',
  input: { schema: ModerateMessageInputSchema },
  output: { schema: ModerateMessageOutputSchema },
  model: googleAI.model('gemini-1.5-flash-latest'),
  prompt: `You are a strict content moderator for a dating app. Your task is to detect if a user is trying to share contact information.

  Analyze the following message. A message should be blocked if it contains:
  1. A sequence of 7 or more digits.
  2. Any standalone digit (e.g., "1", "5").
  3. Any words that spell out numbers in English (e.g., "one", "two", "three").
  4. Any text that asks to share or exchange phone numbers.

  If the message should be blocked, set isBlocked to true and provide a brief reason. Otherwise, set isBlocked to false.

  Message to analyze:
  {{{text}}}
  `,
});

const moderateMessageFlow = ai.defineFlow(
  {
    name: 'moderateMessageFlow',
    inputSchema: ModerateMessageInputSchema,
    outputSchema: ModerateMessageOutputSchema,
  },
  async (input) => {
    // Regex to detect digits, spelled-out numbers, and keywords for sharing info.
    const contactInfoRegex = new RegExp(
      '\\d{7,}|' + // 7 or more digits in a row
      '\\b(\\d|one|two|three|four|five|six|seven|eight|nine|zero)\\b|' + // standalone digits or spelled-out numbers
      '\\b(number|phone|contact|whatsapp|ig|instagram|snapchat)\\b', // keywords
      'i' // case-insensitive
    );

    if (contactInfoRegex.test(input.text)) {
      return {
        isBlocked: true,
        reason: "Sharing contact information is not allowed.",
      };
    }
    
    // If no contact info is detected by the regex, the message is allowed.
    return {
        isBlocked: false,
    };
  }
);
