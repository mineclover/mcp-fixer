import { z } from 'zod';
export const FixedInterfaceSchema = z.object({
    id: z.string(),
    toolId: z.string(),
    name: z.string().min(1),
    displayName: z.string().min(1),
    description: z.string().optional(),
    schemaJson: z.string(),
    parametersJson: z.string(),
    responseSchemaJson: z.string(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    isActive: z.boolean().default(true),
    createdAt: z.date(),
    lastValidated: z.date().optional(),
    validationErrors: z.string().optional(),
});
