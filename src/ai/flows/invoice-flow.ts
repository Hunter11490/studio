'use server';

/**
 * @fileOverview A Genkit flow that generates a structured HTML invoice for a patient.
 *
 * - generateInvoiceHtml - A function that takes patient and financial data and returns a formatted HTML string.
 * - InvoiceHtmlInput - The input type for the function.
 * - InvoiceHtmlOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
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


const InvoiceHtmlOutputSchema = z.object({
  html: z.string().describe('A single, self-contained HTML string representing the styled invoice. It should use inline CSS for styling and be ready to print.'),
});
export type InvoiceHtmlOutput = z.infer<typeof InvoiceHtmlOutputSchema>;


export async function generateInvoiceHtml(input: InvoiceHtmlInput): Promise<InvoiceHtmlOutput> {
  return generateInvoiceFlow(input);
}


const generateInvoiceFlow = ai.defineFlow(
  {
    name: 'generateInvoiceFlow',
    inputSchema: InvoiceHtmlInputSchema,
    outputSchema: InvoiceHtmlOutputSchema,
  },
  async (input) => {
    const prompt = `
        You are an expert financial report designer for hospitals. Your task is to generate a clean, professional, and easy-to-read HTML invoice based on the provided JSON data. The output MUST be a single, self-contained HTML string with inline CSS for styling. Do not include any markdown, just raw HTML.

        **Instructions:**
        1.  **Language and Direction:** The invoice language is **${input.lang === 'ar' ? 'Arabic' : 'English'}**. The document direction should be **${input.lang === 'ar' ? 'rtl' : 'ltr'}**.
        2.  **Header:** Create a header with the hospital logo on one side and the hospital name and invoice title ("${input.labels.invoiceTitle}") on the other.
        3.  **Patient Information:** Display the patient's name and ID, and the current date.
        4.  **Financial Summary:** Calculate and display a summary section with:
            *   Total Charges (sum of all positive amounts).
            *   Total Payments (sum of absolute values of all negative amounts).
            *   Balance Due (Total Charges - Total Payments).
        5.  **Detailed Transactions Table:** Create a table listing all financial records. The table should have columns for: Description, Date, and Amount.
            *   Positive amounts are charges.
            *   Negative amounts are payments. Display them as positive numbers in the "Amount" column but use them for payment calculation.
        6_  **Styling:** Use a professional and clean design with inline CSS. Use shades of blue for headers and borders. Ensure good typography and spacing. The currency is "${input.labels.iqd}".
        7. **Footer:** Add a simple footer with a thank you note or other relevant information.

        **Labels to use:**
        - Invoice Title: "${input.labels.invoiceTitle}"
        - Patient Name: "${input.labels.patientName}"
        - Patient ID: "${input.labels.patientId}"
        - Invoice Date: "${input.labels.invoiceDate}"
        - Total Charges: "${input.labels.totalCharges}"
        - Total Payments: "${input.labels.totalPayments}"
        - Balance Due: "${input.labels.balanceDue}"
        - Table Headers: "${input.labels.itemDescription}", "${input.labels.date}", "${input.labels.amount}"
        - Summary Title: "${input.labels.summary}"
        - Footer: "${input.labels.footerNotes}"

        **JSON Data:**
        ${JSON.stringify(input, null, 2)}

        Generate the HTML now.
    `;

    const llmResponse = await ai.generate({
      model: googleAI.model('gemini-1.5-flash-latest'),
      prompt: prompt,
    });

    const htmlContent = llmResponse.text().replace(/```html/g, '').replace(/```/g, '').trim();

    return { html: htmlContent };
  }
);
