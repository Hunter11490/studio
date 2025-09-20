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

const TranslateTextInputSchema = z.object({
  name: z.string().describe('The name to translate.'),
  specialty: z.string().describe('The specialty to translate.'),
  clinicAddress: z.string().describe('The clinic address to translate.'),
  targetLanguage: z.string().describe('The target language to translate to (e.g., "Arabic", "English").'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
    name: z.string().describe('The translated name.'),
    specialty: z.string().describe('The translated specialty.'),
    clinicAddress: z.string().describe('The translated clinic address.'),
});
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translationPrompt',
  input: {schema: TranslateTextInputSchema},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Translate the following JSON values to {{{targetLanguage}}}. Return only the translated JSON object.

{
  "name": "{{{name}}}",
  "specialty": "{{{specialty}}}",
  "clinicAddress": "{{{clinicAddress}}}"
}

Provide only the translated JSON object.`,
});

const translationFlow = ai.defineFlow(
  {
    name: 'translationFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async input => {
    // Avoid translating if the text is simple
    if (!input.name || input.name.trim().length < 2) {
        return { name: input.name, specialty: input.specialty, clinicAddress: input.clinicAddress };
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);
