/**
 * @fileOverview Zod schemas for the simulation flow. These schemas are used for defining the types
 * for the Genkit flow inputs and outputs.
 */
import { z } from 'genkit';

export const PatientSchema = z.object({
  id: z.string(),
  patientName: z.string(),
  department: z.string(),
  status: z.string().optional(),
  triageLevel: z.string().optional(),
  admittedAt: z.string().optional(),
});

export const DoctorSchema = z.object({
  id: z.string(),
  name: z.string(),
  specialty: z.string(),
});

export const ServiceRequestSchema = z.object({
  id: z.string(),
  type: z.string(),
  status: z.string(),
  department: z.string(),
});
