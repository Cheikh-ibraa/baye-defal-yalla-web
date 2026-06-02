import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-alert-popup',
  templateUrl: './alert-popup.component.html',
  styleUrls: ['./alert-popup.component.css']
})
export class AlertPopupComponent {
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() title: string = 'Information';
  @Input() message: string = '';
  @Input() confirmText: string = 'OK';
  @Input() cancelText: string = 'Annuler';
  @Input() showCancel: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get iconClass(): string {
    return this.type;
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}