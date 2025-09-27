'use server';
/**
 * @fileOverview A Genkit flow that acts as the "brain" for the hospital simulation.
 * It analyzes the current state of the hospital and decides on the next logical actions to take.
 *
 * - runSimulationCycle - The main function that orchestrates a single cycle of the simulation.
 * - SimulationState - The input type representing the entire hospital state.
 * - SimulationAction - The output type representing a single action to be performed.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import { PatientSchema, DoctorSchema, ServiceRequestSchema } from '@/ai/schemas/simulation-schemas';

// Define input schema for the entire hospital state
const SimulationStateSchema = z.object({
  patients: z.array(PatientSchema).describe('The list of all current patients in the hospital.'),
  doctors: z.array(DoctorSchema).describe('The list of all available doctors.'),
  departments: z.object({
    emergency: z.object({ count: z.number(), capacity: z.number() }),
    icu: z.object({ count: z.number(), capacity: z.number() }),
    wards: z.object({ count: z.number(), capacity: z.number() }),
  }).describe('Statistics for key departments.'),
  serviceRequests: z.array(ServiceRequestSchema).describe('The list of current service requests.'),
});
export type SimulationState = z.infer<typeof SimulationStateSchema>;

// Define output schema for the actions the AI should take
const SimulationActionSchema = z.object({
  action: z.enum([
    'ADMIT_PATIENT_TO_EMERGENCY',
    'TRANSFER_PATIENT_FROM_EMERGENCY_TO_ICU',
    'TRANSFER_PATIENT_FROM_EMERGENCY_TO_WARD',
    'DISCHARGE_PATIENT',
    'CREATE_SERVICE_REQUEST',
    'ADVANCE_SERVICE_REQUEST',
    'NO_ACTION',
  ]).describe('The type of action to perform.'),
  patientId: z.string().optional().describe('The ID of the patient to perform the action on (if applicable).'),
  details: z.string().optional().describe('Additional details for the action, e.g., service request description or discharge status (recovered/deceased).'),
});
export type SimulationAction = z.infer<typeof SimulationActionSchema>;

const SimulationOutputSchema = z.object({
  actions: z.array(SimulationActionSchema).describe('A list of actions to perform in this simulation cycle.'),
});
export type SimulationOutput = z.infer<typeof SimulationOutputSchema>;


export async function runSimulationCycle(input: SimulationState): Promise<SimulationOutput> {
  return simulationFlow(input);
}


const simulationFlow = ai.defineFlow(
  {
    name: 'simulationFlow',
    inputSchema: SimulationStateSchema,
    outputSchema: SimulationOutputSchema,
  },
  async (state) => {
    const prompt = ai.definePrompt({
      name: 'simulationPrompt',
      input: { schema: SimulationStateSchema },
      output: { schema: SimulationOutputSchema },
      model: googleAI.model('gemini-1.5-flash-latest'),
      prompt: `You are the simulation engine for a hospital. Your task is to analyze the current state of the hospital and decide on a few logical next steps.

      Current Hospital State:
      - Patients: {{json patients}}
      - Department Load: {{json departments}}

      Rules for decision making:
      1.  **Admissions:** If the emergency room is not full, your top priority is to admit a new patient. Action: 'ADMIT_PATIENT_TO_EMERGENCY'.
      2.  **Transfers:**
          - If a patient in Emergency is 'critical' and there is space in the ICU, transfer them. Action: 'TRANSFER_PATIENT_FROM_EMERGENCY_TO_ICU'.
          - If a patient in Emergency is 'stable' or 'urgent' and there is space in the Wards, transfer them. Action: 'TRANSFER_PATIENT_FROM_EMERGENCY_TO_WARD'.
      3.  **Discharges:** If there are patients in ICU or Wards who have been admitted for a while, discharge one. Action: 'DISCHARGE_PATIENT'. Randomly decide if the status is 'recovered' (95% chance) or 'deceased' (5% chance) and put it in the details field.
      4.  **Services:** Occasionally, create a new service request or advance an existing one. Actions: 'CREATE_SERVICE_REQUEST' or 'ADVANCE_SERVICE_REQUEST'.
      5.  **Pacing:** Do not perform more than 2-3 actions per cycle to keep the simulation realistic.
      6.  **No Action:** If there are no logical actions to take (e.g., everything is full and no one can be discharged), use the 'NO_ACTION' action.

      Analyze the provided state and return a JSON object with a list of actions to perform.`,
    });

    const { output } = await prompt(state);
    return output!;
  }
);
