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

const ReferralCaseSchema = z.object({
  patientName: z.string().describe("The patient's name to translate."),
  referralDate: z.string().describe("The referral date, do not translate."),
  testDate: z.string().describe("The test date, do not translate."),
  testType: z.string().describe("The test type to translate."),
  patientAge: z.string().describe("The patient's age, do not translate."),
  chronicDiseases: z.string().describe("The chronic diseases to translate."),
});

const DoctorInfoSchema = z.object({
  name: z.string().describe('The name to translate.'),
  specialty: z.string().describe('The specialty to translate.'),
  clinicAddress: z.string().describe('The clinic address to translate.'),
  referralNotes: z.array(ReferralCaseSchema).describe("The translated array of referral case notes.").optional(),
});
export type DoctorInfo = z.infer<typeof DoctorInfoSchema>;


const TranslateTextInputSchema = z.object({
  doctors: z.array(z.object({
    name: z.string().describe('The name to translate.'),
    specialty: z.string().describe('The specialty to translate.'),
    clinicAddress: z.string().describe('The clinic address to translate.'),
    referralNotes: z.array(z.object({
      patientName: z.string(),
      referralDate: z.string(),
      testDate: z.string(),
      testType: z.string(),
      patientAge: z.string(),
      chronicDiseases: z.string(),
    })).describe("An array of referral case notes associated with the doctor.").optional(),
  })).describe('An array of doctor information to translate.'),
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
      prompt: `Translate the text fields for each JSON object in the 'doctors' array into {{{targetLanguage}}}.
The fields to translate are: 'name', 'specialty', 'clinicAddress'.
Also, for each doctor, if there is a 'referralNotes' array, translate the text fields 'patientName', 'testType', and 'chronicDiseases' for each object within that array.

- Preserve the entire JSON structure and all keys, including IDs and non-text fields like dates or numbers.
- If a field is missing, keep it missing in the output.
- If a field is present but empty or null, return it as an empty string.
- Your response MUST be a valid JSON object with a "doctors" key containing the fully translated array.

Input:
{{{json doctors}}}

Your response must be only the translated JSON object.`,
    });
    
    const {output} = await prompt(input);
    return output!;
  }
);
