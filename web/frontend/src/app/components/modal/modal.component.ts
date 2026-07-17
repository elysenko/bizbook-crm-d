import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable dialog. On desktop it renders centered; at <=768px it slides up from the bottom
 * as a bottom sheet. Visibility is driven by the host page's `?modal=` query param.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class ModalComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}
