/**
 * @fileOverview Schemas for the invoice generation flow.
 *
 * - InvoiceHtmlInput - The input type for the function.
 * - InvoiceHtmlOutput - The return type for the function.
 */

import { z } from 'genkit';

const FinancialRecordSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  description: z.string(),
  amount: z.number(),
  date: z.string(),
});

export const InvoiceHtmlInputSchema = z.object({
  patientName: z.string(),
  patientId: z.string(),
  records: z.array(FinancialRecordSchema),
  hospitalName: z.string(),
  hospitalLogoUrl: z.string().url(),
  lang: z.enum(['en', 'ar']),
  labels: z.object({
    invoiceTitle: z.string(),
    patientName: z.string(),
    patientId: z.string(),
    invoiceDate: z.string(),
    totalCharges: z.string(),
    totalPayments: z.string(),
    balanceDue: z.string(),
    itemDescription: z.string(),
    date: z.string(),
    amount: z.string(),
    iqd: z.string(),
    summary: z.string(),
    footerNotes: z.string()
  })
});
export type InvoiceHtmlInput = z.infer<typeof InvoiceHtmlInputSchema>;


export const InvoiceHtmlOutputSchema = z.object({
  html: z.string().describe('A single, self-contained HTML string representing the styled invoice. It should use inline CSS for styling and be ready to print.'),
});
export type InvoiceHtmlOutput = z.infer<typeof InvoiceHtmlOutputSchema>;
