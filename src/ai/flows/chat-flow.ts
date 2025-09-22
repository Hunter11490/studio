'use server';

/**
 * @fileOverview Implements a conversational AI assistant to answer doctors' questions.
 *
 * - chat - A function that handles the conversation with the AI assistant.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {z} from 'genkit';

const ChatInputSchema = z.object({
  question: z.string().describe('The question from the doctor.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  answer: z.string().describe('The answer from the AI assistant.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async input => {
    const prompt = ai.definePrompt({
      name: 'chatPrompt',
      input: {schema: ChatInputSchema},
      output: {schema: ChatOutputSchema},
      model: googleAI.model('gemini-1.5-flash-latest'),
      prompt: `You are a medical assistant helping medical representatives by answering questions from doctors. Use your knowledge to provide accurate and helpful answers.\n\nQuestion: {{{question}}}`,
    });

    const {output} = await prompt(input);
    return output!;
  }
);
