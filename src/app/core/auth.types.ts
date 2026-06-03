export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adress: string;
  lat: number | null;
  lon: number | null;
  profil: string;
  pharmacyId?: number | null;
}

export interface AuthResult {
  isSuccess: boolean;
  token?: string | null;
  refreshToken?: string | null;
  user?: User | null;
  errorMessage?: string | null;
  requiresOTP?: boolean;
}
