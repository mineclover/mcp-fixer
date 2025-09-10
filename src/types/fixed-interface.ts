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

export type FixedInterface = z.infer<typeof FixedInterfaceSchema>;

export interface FixedInterfaceCreateInput {
  toolId: string;
  name: string;
  displayName: string;
  description?: string;
  schema: Record<string, unknown>;
  parameters: Record<string, unknown>;
  responseSchema: Record<string, unknown>;
  version: string;
}

export interface FixedInterfaceUpdateInput {
  displayName?: string;
  description?: string;
  schema?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  responseSchema?: Record<string, unknown>;
  version?: string;
  isActive?: boolean;
}

export interface FixedInterfaceValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  schemaChanges?: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}

export interface FixedInterfaceExecutionOptions {
  parameters: Record<string, unknown>;
  timeout?: number;
  retries?: number;
  useCache?: boolean;
}

export interface FixedInterfaceExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  performanceMetrics: {
    responseTimeMs: number;
    fromCache: boolean;
  };
}