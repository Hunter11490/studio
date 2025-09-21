'use server';

/**
 * @fileOverview A Genkit flow that translates text.
 *
 * - translateText - A function that takes text and a target language and returns the translated text.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
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
    // Avoid translating if there's nothing to translate
    if (!input.doctors || input.doctors.length === 0) {
        return { doctors: [] };
    }
    
    const prompt = ai.definePrompt({
      name: 'translationPrompt',
      input: {schema: TranslateTextInputSchema},
      output: {schema: TranslateTextOutputSchema},
      prompt: `Translate the following JSON array of doctor information into {{{targetLanguage}}}. 
Return only the translated JSON object containing the 'doctors' array. Do not alter the structure.

Input:
{{{json doctors}}}

Provide only the translated JSON object.`,
    });
    
    const {output} = await prompt(input);
    return output!;
  }
);
