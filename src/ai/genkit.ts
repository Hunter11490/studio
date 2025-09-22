'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import { config } from 'dotenv';
config();

export const ai = genkit({
  plugins: [
    googleAI({
      // Using the provided key directly as a temporary measure to solve deployment issues.
      apiKey: 'AIzaSyByMm6mT-smSDfaAiFiDYJggNShP294XNE',
    }),
    // googleCloud(), // Temporarily removed to resolve startup error.
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
