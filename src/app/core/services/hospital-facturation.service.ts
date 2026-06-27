import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NiveauHotellerie {
  id: number;
  libelle: string;
  typeChambre: string;
  prixHotellerieJ: number;
  prixSoinsJ: number;
  actif: boolean;
  ordre: number;
}

export type FactureStatut =
  | 'BROUILLON' | 'OUVERTE' | 'CAUTION_ATTEINTE'
  | 'PARTIELLEMENT_PAYEE' | 'SOLDEE' | 'CLOTUREE';

export interface Facture {
  id: string;
  reference: string;
  patientName: string;
  patientId: string;
  hospitalizationId: string;
  niveauLibelle: string;
  prixHotellerieJ: number;
  prixSoinsJ: number;
  nbJoursEstimes: number;
  nbJoursReels?: number;
  totalHotellerie: number;
  totalSoins: number;
  totalPharmacie: number;
  montantTotal: number;
  montantCaution: number;
  seuilCautionPct: number;
  montantCollecte: number;
  statut: FactureStatut;
  dateGeneration: string;
}

export interface FactureProgression {
  factureId: string;
  reference: string;
  statut: FactureStatut;
  montantTotal: number;
  montantCaution: number;
  montantCollecte: number;
  reliquat: number;
  cautionAtteinte: boolean;
  pctCaution: number;
  pctTotal: number;
  lienDon: string;
}

@Injectable({ providedIn: 'root' })
export class HospitalFacturationService {
  private readonly http = inject(HttpClient);
  private readonly api  = environment.baseUrl;

  getNiveaux(): Observable<NiveauHotellerie[]> {
    return this.http.get<NiveauHotellerie[]>(`${this.api}/hotellerie/niveaux`);
  }

  genererFacture(dto: {
    hospitalizationId: string;
    niveauHotellerieId: number;
    nbJoursEstimes: number;
    montantCaution: number;
  }): Observable<Facture> {
    return this.http.post<Facture>(`${this.api}/hospital/factures`, dto);
  }

  getFactures(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.api}/hospital/factures`);
  }

  getFacture(id: string): Observable<Facture> {
    return this.http.get<Facture>(`${this.api}/hospital/factures/${id}`);
  }

  getProgression(id: string): Observable<FactureProgression> {
    return this.http.get<FactureProgression>(`${this.api}/hospital/factures/${id}/progression`);
  }

  cloturerFacture(id: string, nbJoursReels: number): Observable<Facture> {
    return this.http.patch<Facture>(`${this.api}/hospital/factures/${id}/cloturer`, { nbJoursReels });
  }

  // Public (sans auth)
  getProgressionPublique(id: string): Observable<FactureProgression> {
    return this.http.get<FactureProgression>(`${this.api}/hospital/factures/${id}/progression`);
  }
}
