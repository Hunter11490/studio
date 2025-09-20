'use server';
/**
 * @fileOverview A Genkit flow to search for doctors on the internet.
 *
 * - searchInternetForDoctors - A function that takes a search query and returns a list of doctors found.
 * - InternetSearchInput - The input type for the search.
 * - InternetSearchOutput - The return type for the search.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DoctorSchema = z.object({
  name: z.string().describe("The doctor's full name."),
  specialty: z.string().describe("The doctor's medical specialty."),
  phoneNumber: z.string().describe("The doctor's contact phone number."),
  clinicAddress: z.string().describe("The full address of the doctor's clinic."),
});

const InternetSearchInputSchema = z.object({
  query: z
    .string()
    .describe(
      'A search query that can include name, specialty, city, region, or any other relevant information about doctors in Iraq.'
    ),
});
export type InternetSearchInput = z.infer<typeof InternetSearchInputSchema>;

const InternetSearchOutputSchema = z.object({
  doctors: z.array(DoctorSchema).describe('An array of doctors found based on the query.'),
});
export type InternetSearchOutput = z.infer<typeof InternetSearchOutputSchema>;

export async function searchInternetForDoctors(
  input: InternetSearchInput
): Promise<InternetSearchOutput> {
  return internetSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'internetSearchPrompt',
  input: { schema: InternetSearchInputSchema },
  output: { schema: InternetSearchOutputSchema },
  prompt: `You are an expert researcher. Your task is to find doctors in Iraq based on the provided query.
Use your knowledge to find as many relevant doctors as possible.
Return the results as a structured JSON object. For each doctor, provide their name, specialty, phone number, and clinic address.
If you cannot find any information, return an empty array for the doctors.

Search Query: "{{{query}}}"`,
});

const internetSearchFlow = ai.defineFlow(
  {
    name: 'internetSearchFlow',
    inputSchema: InternetSearchInputSchema,
    outputSchema: InternetSearchOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
