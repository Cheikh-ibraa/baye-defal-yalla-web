export interface Imagerie {
  id: number;
  patientName: string;
  doctorName: string;
  imagingCenterName: string;
  type: string;
  region: string;
  clinicalIndication: string;
  youngPatient: boolean;
  urgencyLevel: string;
  status: string;
  createdAt: string;
  appointmentDate: string;
  appointmentTime: string;
  pictures: string[];
  report: string;
  reportFile: string;
}

export interface ImagerieResponse {
  content: Imagerie[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export enum UrgencyLevel {
  NORMAL = 'NORMAL',
  PRIORITAIRE = 'PRIORITAIRE',
  URGENT = 'URGENT'
}


export interface ImagerieCreate {
  patientId: number;
  doctorId: number;
  imagingCenterId: number;
  typeId: number;
  regionId: number;
  clinicalIndication: string;
  youngPatient: boolean;
  urgencyLevel: UrgencyLevel;
}



export interface Examen {
  id: number;

  patientName: string;
  doctorName: string;
  imagingCenterName: string;

  type: string;
  region: string;
  clinicalIndication: string;

  youngPatient: boolean;

  urgencyLevel: 'NORMAL' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

  createdAt: string; // ISO date string

  appointmentDate: string;
  appointmentTime: string;

  pictures: string[];

  report: string;
  reportFile: string;

  accessionNumber?: string;
  dicomViewerUrl?: string;
}

export interface PacsViewerResponse {
  studies: string[];
  series: {
    [key: string]: string[];
  };
}
