import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface NeedTypeItem   { type: string; count: number; amount: number; }
interface BeneficiaryItem { type: string; count: number; }

interface ReportDetail {
  period: string;
  label:  string;
  totalAllocated:      number;
  usedAmount:          number;
  remaining:           number;
  beneficiairesAides:  number;
  livesChanged:        number;
  needTypeBreakdown:   NeedTypeItem[];
  beneficiaryBreakdown: BeneficiaryItem[];
  activities:          { completed: number; inProgress: number; pending: number };
}

@Component({
  selector: 'app-detail-rapport',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detail-rapport.component.html',
  styleUrls: ['./detail-rapport.component.css']
})
export class DetailRapportComponent implements OnInit {
  period = '';
  report: ReportDetail | null = null;
  isLoading = true;
  error: string | null = null;

  private get authHeaders() {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
  }

  constructor(
    private route:    ActivatedRoute,
    private location: Location,
    private http:     HttpClient,
  ) {}

  ngOnInit(): void {
    this.period = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.period) this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.http.get<ReportDetail>(
      `${environment.baseUrl}/organization/reports/${this.period}`,
      { headers: this.authHeaders }
    ).subscribe({
      next: (res) => { this.report = res; this.isLoading = false; },
      error: () => { this.error = 'Impossible de charger ce rapport.'; this.isLoading = false; },
    });
  }

  formatAmount(n: number): string {
    return (n ?? 0).toLocaleString('fr-FR');
  }

  needTypeLabel(type: string): string {
    const map: Record<string, string> = {
      ORDONNANCE:  'Ordonnances',
      ANALYSE:     'Analyses médicales',
      IMAGERIE:    'Imagerie médicale',
      EQUIPEMENT:  'Équipements',
    };
    return map[type] ?? type;
  }

  getBeneficiaryCount(type: string): number {
    return this.report?.beneficiaryBreakdown?.find(b => b.type === type)?.count ?? 0;
  }

  goBack(): void { this.location.back(); }
}
