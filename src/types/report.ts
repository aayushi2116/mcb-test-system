import { TestRecord } from './test';

export interface ReportCertificate {
  certificateNumber: string;
  testRecord: TestRecord;
  laboratoryName: string;
  laboratoryAccreditation: string;
  testStandard: string;
  issueDate: string;
  signatoryName: string;
  signatoryDesignation: string;
  qrVerificationCode: string;
  disclaimer: string;
}
