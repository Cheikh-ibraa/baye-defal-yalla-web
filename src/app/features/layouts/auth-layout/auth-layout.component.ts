import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil, takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.css']
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
  pharmaciesCount = 0;
  deliveriesCount = 0;
  doctorsCount = 0;

  private readonly PHARMACIES_TARGET = 100;
  private readonly DELIVERIES_TARGET = 500;
  private readonly DOCTORS_TARGET = 50;

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.animateCounters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private animateCounters(): void {
    const duration = 3000;
    const steps = 80;
    const stepDuration = duration / steps;

    let currentStep = 0;

    interval(stepDuration)
      .pipe(
        takeUntil(this.destroy$),
        takeWhile(() => currentStep <= steps)
      )
      .subscribe(() => {
        const progress = this.easeOutQuad(currentStep / steps);

        this.pharmaciesCount = Math.floor(progress * this.PHARMACIES_TARGET);
        this.deliveriesCount = Math.floor(progress * this.DELIVERIES_TARGET);
        this.doctorsCount = Math.floor(progress * this.DOCTORS_TARGET);

        currentStep++;
      });
  }

  private easeOutQuad(t: number): number {
    return t * (2 - t);
  }
}
