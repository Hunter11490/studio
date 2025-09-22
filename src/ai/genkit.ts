'use server';
/**
 * @fileOverview Initializes and configures the Genkit AI instance.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {googleCloud} from '@genkit-ai/google-cloud';

export const ai = genkit({
  plugins: [
    googleAI(),
    googleCloud(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
