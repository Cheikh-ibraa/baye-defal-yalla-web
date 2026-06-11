import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComptesComponent } from './comptes.component';

@Component({
  selector: 'app-medical-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comptes.component.html',
  styleUrl: './comptes.component.css'
})
export class MedicalAccountComponent extends ComptesComponent {}
