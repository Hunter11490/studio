/**
 * @fileOverview Initializes and configures the Genkit AI instance.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: 'AIzaSyByMm6mT-smSDfaAiFiDYJggNShP294XNE',
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
