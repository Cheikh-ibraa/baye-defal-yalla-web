export interface Laboratoire {
  id: number;
  patientName: string;
  doctorName: string;
  laboratoryName: string;
  type: string;
  clinicalIndication: string;
  youngPatient: boolean;
  urgencyLevel: 'NORMAL' | 'PRIORITAIRE' | 'URGENT';
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  appointmentDate: string;
  appointmentTime: string;
  pictures: string[];
  report: string;
  reportFile: string;
  pdfPassword?: string;
}
export interface LaboratoireResponse {
  content: Laboratoire[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
