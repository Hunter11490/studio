// src/ai/flows/ai-suggested-doctors.ts
'use server';

/**
 * @fileOverview A Genkit flow that suggests doctors based on location, specialty, and language.
 *
 * - suggestDoctors - A function that takes location, specialty, and language as input and returns a list of suggested doctors.
 * - SuggestDoctorsInput - The input type for the suggestDoctors function.
 * - SuggestDoctorsOutput - The return type for the suggestDoctors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDoctorsInputSchema = z.object({
  location: z.string().describe('The location to search for doctors in.'),
  specialty: z.string().describe('The medical specialty to search for.'),
  language: z.string().describe('The preferred language of the doctor.'),
});
export type SuggestDoctorsInput = z.infer<typeof SuggestDoctorsInputSchema>;

const SuggestDoctorsOutputSchema = z.array(
  z.object({
    name: z.string().describe('The name of the doctor.'),
    address: z.string().describe('The address of the doctor.'),
    phone: z.string().describe('The phone number of the doctor.'),
    specialty: z.string().describe('The medical specialty of the doctor.'),
  })
);
export type SuggestDoctorsOutput = z.infer<typeof SuggestDoctorsOutputSchema>;

export async function suggestDoctors(input: SuggestDoctorsInput): Promise<SuggestDoctorsOutput> {
  return suggestDoctorsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDoctorsPrompt',
  input: {schema: SuggestDoctorsInputSchema},
  output: {schema: SuggestDoctorsOutputSchema},
  prompt: `You are a helpful AI assistant for medical representatives.

  Based on the provided location, specialty, and language, suggest a list of doctors with their details.

  Location: {{{location}}}
  Specialty: {{{specialty}}}
  Language: {{{language}}}

  Format the response as a JSON array of doctors, including their name, address, phone number, and specialty.
  `,
});

const suggestDoctorsFlow = ai.defineFlow(
  {
    name: 'suggestDoctorsFlow',
    inputSchema: SuggestDoctorsInputSchema,
    outputSchema: SuggestDoctorsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
