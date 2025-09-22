'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import * as gc from '@genkit-ai/google-cloud';

// Load environment variables from .env file
import { config } from 'dotenv';
config();

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
    gc.googleCloud(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
