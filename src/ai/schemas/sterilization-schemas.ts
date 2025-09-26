/**
 * @fileOverview Schemas for the sterilization flow.
 *
 * - SterilizationRequestInput - The input type for the request.
 * - SterilizationRequestOutput - The return type for the request.
 */

import {z} from 'genkit';

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
