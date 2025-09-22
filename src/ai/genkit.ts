'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {googleCloud} from '@genkit-ai/google-cloud';
import { config } from 'dotenv';
config();

export const ai = genkit({
  plugins: [
    googleAI({
      // Using the provided key directly as a temporary measure to solve deployment issues.
      apiKey: 'AIzaSyByMm6mT-smSDfaAiFiDYJggNShP294XNE',
    }),
    googleCloud(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
