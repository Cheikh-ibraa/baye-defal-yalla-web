import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nouvelle-chirurgie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nouvelle-chirurgie.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NouvelleChirurgieComponent {
  // Section Patient
  patientSearchQuery = '';
  showPatientCard = true; // Show patient card by default for demonstration matching the design

  // Section Intervention (Right column dropdowns)
  typeChirurgie = 'Pontage Coronarien';
  service = 'Cardiologie Interventionnelle';
  chirurgienResponsable = 'Dr. Sarah Kouassi';

  // Section Planification
  dateIntervention = '';
  heureIntervention = '';
  salleOperation = 'Bloc A - Salle 04 (Équipée Cardio)';

  // Détails médicaux
  diagnostic = '';
  descriptionIntervention = '';
  urgencyLevel: 'Normal' | 'Urgent' | 'Critique' = 'Normal';

  // Aspect financier / Paiement block
  montantChirurgie = '1 250 000';
  statutPaiement = 'Financé';
  paymentSubtext = "Pris en charge par l'Assurance AXA (Réf: POL-889)";

  constructor(private router: Router) {}

  back(): void {
    this.router.navigate(['/chirurgie']);
  }

  submit(): void {
    // Navigate back or perform save action
    this.router.navigate(['/chirurgie']);
  }
}
