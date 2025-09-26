'use server';
/**
 * @fileOverview A Genkit flow for handling sterilization requests.
 *
 * - requestSterilization - A function that creates a new instrument set for sterilization.
 * - SterilizationRequestInput - The input type for the request.
 * - SterilizationRequestOutput - The return type for the request.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { InstrumentSet } from '@/types';

export const SterilizationRequestInputSchema = z.object({
  description: z.string().describe('A description of the instrument set needed, e.g., "Set for an appendectomy" or "Cardiac surgery instruments".'),
  department: z.string().describe('The department requesting the sterilization, e.g., "surgicalOperations".'),
});
export type SterilizationRequestInput = z.infer<typeof SterilizationRequestInputSchema>;

export const SterilizationRequestOutputSchema = z.object({
  newInstrumentSet: z.object({
    id: z.string(),
    name: z.string(),
    department: z.string(),
    status: z.enum(['cleaning', 'packaging', 'sterilizing', 'storage']),
    cycleStartTime: z.number(),
    cycleDuration: z.number(),
  }),
});
export type SterilizationRequestOutput = z.infer<typeof SterilizationRequestOutputSchema>;

// This tool will be used by an AI to add a new instrument set to the system.
// For this app, we will call it directly from the UI, but it's designed as a tool.
export const requestSterilizationTool = ai.defineTool(
  {
    name: 'requestSterilization',
    description: 'Creates a new instrument set and adds it to the sterilization cleaning queue.',
    inputSchema: SterilizationRequestInputSchema,
    outputSchema: SterilizationRequestOutputSchema,
  },
  async (input) => {
    console.log(`Received sterilization request: ${JSON.stringify(input)}`);
    const newSet: InstrumentSet = {
      id: `set-${Date.now()}-${Math.random()}`,
      // In a real scenario, an LLM could generate a more appropriate name from the description.
      // For now, we'll use the description as the name for simplicity.
      name: input.description,
      department: input.department,
      status: 'cleaning',
      cycleStartTime: Date.now(),
      cycleDuration: (15 + Math.random() * 15) * 60, // 15-30 minutes cycle
    };
    return { newInstrumentSet: newSet };
  }
);

export async function requestSterilization(input: SterilizationRequestInput): Promise<SterilizationRequestOutput> {
  // Directly calling the tool logic for this implementation.
  return requestSterilizationTool(input);
}
