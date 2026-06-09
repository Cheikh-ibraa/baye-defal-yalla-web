import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-detail-rapport',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detail-rapport.component.html',
  styleUrls: ['./detail-rapport.component.css']
})
export class DetailRapportComponent implements OnInit {
  rapportId: string | null = null;
  moisRapport = 'Avril 2026';

  // KPI states matching the screenshot (defaulting to April 2026)
  budgetUtilise = '425 000 FCFA';
  budgetRestant = '3 575 000 FCFA';
  beneficiairesAides = '3 575 000 FCFA'; // Mocked typo exactly from the image

  constructor(
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.rapportId = this.route.snapshot.paramMap.get('id');
    if (this.rapportId) {
      const idNum = parseInt(this.rapportId, 10);
      const months = ['Avril 2026', 'Mars 2026', 'Février 2026', 'Janvier 2026', 'Décembre 2025', 'Novembre 2025'];
      if (idNum >= 1 && idNum <= 6) {
        this.moisRapport = months[idNum - 1];
      }

      // Dynamize the numbers depending on selection to feel more alive
      if (idNum === 2) {
        this.budgetUtilise = '2 500 000 FCFA';
        this.budgetRestant = '5 000 000 FCFA';
        this.beneficiairesAides = '5 000 000 FCFA';
      } else if (idNum === 3) {
        this.budgetUtilise = '500 000 FCFA';
        this.budgetRestant = '7 500 000 FCFA';
        this.beneficiairesAides = '7 500 000 FCFA';
      } else if (idNum >= 4) {
        this.budgetUtilise = '2 000 000 FCFA';
        this.budgetRestant = '8 000 000 FCFA';
        this.beneficiairesAides = '8 000 000 FCFA';
      }
    }
  }

  goBack(): void {
    this.location.back();
  }
}
