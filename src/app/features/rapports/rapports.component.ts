import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface RapportMensuel {
  id: number;
  mois: string;
  annee: number;
  type: 'mensuel' | 'annuel';
  budgetUtilise: string;
  budgetRestant: string;
  utilisation: number;
}

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rapports.component.html',
  styleUrls: ['./rapports.component.css']
})
export class RapportsComponent implements OnInit {
  activeTab: 'all' | 'mensuel' | 'annuel' = 'all';

  rapports: RapportMensuel[] = [
    { id: 1, mois: 'Avril', annee: 2026, type: 'mensuel', budgetUtilise: '1 500 000 F', budgetRestant: '3 500 000 F', utilisation: 10 },
    { id: 2, mois: 'Mars', annee: 2026, type: 'mensuel', budgetUtilise: '2 500 000 F', budgetRestant: '5 000 000 F', utilisation: 20 },
    { id: 3, mois: 'Février', annee: 2026, type: 'mensuel', budgetUtilise: '500 000 F', budgetRestant: '7 500 000 F', utilisation: 5 },
    { id: 4, mois: 'Janvier', annee: 2026, type: 'mensuel', budgetUtilise: '2 000 000 F', budgetRestant: '8 000 000 F', utilisation: 84 },
    { id: 5, mois: 'Décembre', annee: 2025, type: 'mensuel', budgetUtilise: '2 000 000 F', budgetRestant: '8 000 000 F', utilisation: 84 },
    { id: 6, mois: 'Novembre', annee: 2025, type: 'mensuel', budgetUtilise: '2 000 000 F', budgetRestant: '8 000 000 F', utilisation: 84 }
  ];

  filteredRapports: RapportMensuel[] = [];

  ngOnInit(): void {
    this.filterRapports();
  }

  setTab(tab: 'all' | 'mensuel' | 'annuel'): void {
    this.activeTab = tab;
    this.filterRapports();
  }

  filterRapports(): void {
    if (this.activeTab === 'all') {
      this.filteredRapports = this.rapports;
    } else {
      this.filteredRapports = this.rapports.filter(r => r.type === this.activeTab);
    }
  }
}
