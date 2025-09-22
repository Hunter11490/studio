'use server';
/**
 * @fileOverview A Genkit flow that searches the internet for doctors.
 *
 * - searchInternetForDoctors - A function that takes a search query and returns a list of doctors found online.
 * - InternetSearchInput - The input type for the search.
 * - InternetSearchOutput - The return type for the search.
 */

import {ai} from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {z} from 'genkit';

const DoctorSchema = z.object({
  name: z.string().describe('The full name of the doctor.'),
  specialty: z.string().describe('The medical specialty of the doctor.'),
  phoneNumber: z.string().describe('The contact phone number of the doctor or clinic.'),
  address: z.string().describe('The full address of the clinic or hospital.'),
});

const InternetSearchInputSchema = z.object({
  query: z.string().describe('A search query for finding doctors. Can include name, specialty, city, region, neighborhood, street, etc.'),
});
export type InternetSearchInput = z.infer<typeof InternetSearchInputSchema>;

const InternetSearchOutputSchema = z.object({
  doctors: z.array(DoctorSchema).describe('An array of doctors found matching the search query.'),
});
export type InternetSearchOutput = z.infer<typeof InternetSearchOutputSchema>;

export async function searchInternetForDoctors(input: InternetSearchInput): Promise<InternetSearchOutput> {
  return internetSearchFlow(input);
}

const internetSearchFlow = ai.defineFlow(
  {
    name: 'internetSearchFlow',
    inputSchema: InternetSearchInputSchema,
    outputSchema: InternetSearchOutputSchema,
  },
  async (input) => {
    const prompt = ai.definePrompt({
      name: 'internetSearchPrompt',
      input: {schema: InternetSearchInputSchema},
      output: {schema: InternetSearchOutputSchema},
      model: googleAI.model('gemini-1.5-flash-latest'),
      prompt: `You are an expert medical directory assistant for Iraq. Your task is to find real doctors based on the user's query.

Perform a deep and comprehensive search for doctors in Iraq across multiple sources, including Google Search, Facebook, and other social media platforms, based on the following query: {{{query}}}

Return a list of doctors you find. For each doctor, provide their name, specialty, phone number, and a detailed address.
If you cannot find a specific piece of information, leave it as an empty string. Return at least 100 results if possible, aiming for the maximum number of accurate results you can find.`,
    });
    
    const { output } = await prompt(input);
    return output!;
  }
);
