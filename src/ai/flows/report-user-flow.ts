
'use server';

/**
 * @fileOverview A flow for handling user reports.
 *
 * - submitUserReport - A function that submits a user report for review.
 * - ReportUserInput - The input type for the submitUserReport function.
 * - ReportUserOutput - The return type for the submitUserReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ReportUserInputSchema = z.object({
  reportingUserId: z.string().describe("The ID of the user submitting the report."),
  reportedUserId: z.string().describe("The ID of the user being reported."),
  reason: z.string().describe("The reason for the report, including description."),
  proofImage: z.string().nullable().describe(
      "An optional image provided as proof, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ReportUserInput = z.infer<typeof ReportUserInputSchema>;

const ReportUserOutputSchema = z.object({
  success: z.boolean().describe("Whether the report was submitted successfully."),
  reportId: z.string().describe("The ID of the created report."),
});
export type ReportUserOutput = z.infer<typeof ReportUserOutputSchema>;

export async function submitUserReport(input: ReportUserInput): Promise<ReportUserOutput> {
  return reportUserFlow(input);
}

const prompt = ai.definePrompt({
  name: 'userReportPrompt',
  input: { schema: ReportUserInputSchema },
  output: { schema: ReportUserOutputSchema },
  model: googleAI.model('gemini-1.5-flash-latest'),
  prompt: `A user report has been submitted. Please process it.

Reporting User ID: {{{reportingUserId}}}
Reported User ID: {{{reportedUserId}}}
Reason:
{{{reason}}}

{{#if proofImage}}
Proof Image:
{{media url=proofImage}}
{{/if}}

Acknowledge receipt and generate a report ID. In a real application, this would be logged to a database or sent to a moderation queue. For now, just confirm success and create a mock report ID.`,
});

const reportUserFlow = ai.defineFlow(
  {
    name: 'reportUserFlow',
    inputSchema: ReportUserInputSchema,
    outputSchema: ReportUserOutputSchema,
  },
  async (input) => {
    // In a real app, you would save the report to a 'reports' collection in Firestore.
    // For this demo, we'll just log it to the console and simulate a successful submission.
    console.log("Processing user report:", input);
    
    // Simulate calling an AI model or other service.
    // const { output } = await prompt(input);
    
    // For now, we'll just return a mock success response.
    const mockReportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      success: true,
      reportId: mockReportId,
    };
  }
);
