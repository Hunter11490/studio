'use server';

/**
 * @fileOverview A Genkit flow that translates text.
 *
 * - translateText - A function that takes text and a target language and returns the translated text.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {z} from 'genkit';


const DoctorInfoSchema = z.object({
  name: z.string().describe('The name to translate.'),
  specialty: z.string().describe('The specialty to translate.'),
  clinicAddress: z.string().describe('The clinic address to translate.'),
});
export type DoctorInfo = z.infer<typeof DoctorInfoSchema>;


const TranslateTextInputSchema = z.object({
  doctors: z.array(DoctorInfoSchema).describe('An array of doctor information to translate.'),
  targetLanguage: z.string().describe('The target language to translate to (e.g., "Arabic", "English").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
    doctors: z.array(DoctorInfoSchema).describe('The translated array of doctor information.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translationFlow(input);
}

const translationFlow = ai.defineFlow(
  {
    name: 'translationFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async input => {
    const prompt = ai.definePrompt({
      name: 'translationPrompt',
      input: {schema: TranslateTextInputSchema},
      output: {schema: TranslateTextOutputSchema},
      model: googleAI.model('gemini-1.5-flash-latest'),
      prompt: `Translate the text fields (name, specialty, clinicAddress) for each JSON object in the 'doctors' array into {{{targetLanguage}}}.
Preserve the JSON structure and keys. Return only the translated JSON object. Your response MUST be a valid JSON object with a "doctors" key containing the array.

Input:
{{{json doctors}}}

Your response must be only the translated JSON object.`,
    });
    
    const {output} = await prompt(input);
    return output!;
  }
);
