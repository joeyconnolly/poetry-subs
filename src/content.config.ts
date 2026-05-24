import { defineCollection, z } from 'astro:content';
import Papa from 'papaparse';

const magazines = defineCollection({
  loader: async () => {
    const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRkw6mteGQklx8wEbEp--YGfEnxndCo-oajtv1NoGW88KW-_GtsG2K9PeIJ0n2BoJjAiWzgdy7SdWvQ/pub?output=csv');
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    const csvText = await response.text();
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    
    return parsed.data.map((row: any, index) => {
      // Basic string cleaner
      const cleanString = (val: string) => (val && val.trim() !== '') ? val.trim() : undefined;
      
      // Smart URL cleaner: adds https:// if it's missing!
      const cleanUrl = (val: string) => {
        let url = cleanString(val);
        if (!url) return undefined;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          return `https://${url}`;
        }
        return url;
      };
      
      const cleanBool = (val: string) => {
        if (!val || val.trim() === '') return undefined;
        return val.toUpperCase() === 'TRUE';
      };

      const normalizeStatus = (val: string) => {
        const cleaned = cleanString(val);
        if (!cleaned) return 'Unknown';
        const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
        const allowedStatuses = ['Open', 'Closed', 'Soon', 'Unknown'];
        return allowedStatuses.includes(formatted) ? formatted : 'Unknown';
      };

      return {
        id: `mag-${index}`,
        name: row.name,
        url: cleanUrl(row.url), // Using our new smart cleaner here
        status: normalizeStatus(row.status),
        deadline: cleanString(row.deadline),
        region: cleanString(row.region) || 'Unknown',
        pays: cleanBool(row.pays),
        fee: cleanBool(row.fee),
        description: cleanString(row.description),
        notes: cleanString(row.notes),
        prestige: cleanString(row.prestige),
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
    notes: z.string().optional(),
    prestige: z.string().optional(),
  }),
});

export const collections = { magazines };