import { defineCollection, z } from 'astro:content';
import Papa from 'papaparse';

const magazines = defineCollection({
  loader: async () => {
    const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRkw6mteGQklx8wEbEp--YGfEnxndCo-oajtv1NoGW88KW-_GtsG2K9PeIJ0n2BoJjAiWzgdy7SdWvQ/pub?output=csv');
    const csvText = await response.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    
    return parsed.data.map((row: any, index) => {
      // Helper function: if a cell is blank, make it officially 'undefined' so Astro ignores it
      const cleanString = (val: string) => (val && val.trim() !== '') ? val.trim() : undefined;
      
      // Helper function for booleans: handles blanks gracefully
      const cleanBool = (val: string) => {
        if (!val || val.trim() === '') return undefined;
        return val.toUpperCase() === 'TRUE';
      };

      return {
        id: `mag-${index}`,
        name: row.name, // Still strictly required!
        url: cleanString(row.url),
        // If status is blank, default it to 'Unknown'
        status: cleanString(row.status) || 'Unknown',
        deadline: cleanString(row.deadline),
        region: cleanString(row.region) || 'Unknown',
        pays: cleanBool(row.pays),
        fee: cleanBool(row.fee),
        description: cleanString(row.description),
      };
    });
  },
  
  schema: z.object({
    name: z.string(),
    url: z.string().url().optional(), // Now optional
    status: z.enum(['Open', 'Closed', 'Soon', 'Unknown']).default('Unknown'), // Added Unknown
    deadline: z.string().optional(),
    region: z.string().optional(), 
    pays: z.boolean().optional(),
    fee: z.boolean().optional(),
    description: z.string().optional(),
  }),
});

export const collections = { magazines };