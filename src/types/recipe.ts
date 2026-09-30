import { MCBSpecification, TestConfiguration } from './test';

export interface TestRecipe {
  id: string;
  name: string;
  code: string;
  description: string;
  category: 'STANDARD_IEC' | 'ROUTINE_QC' | 'DEVELOPMENT_BENCHMARK' | 'CUSTOM';
  targetStandard: string;
  mcbTemplate: Partial<MCBSpecification>;
  testConfig: TestConfiguration;
  createdAt: string;
  updatedAt: string;
  author: string;
  isSystemDefault?: boolean;
}
