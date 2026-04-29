import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

// Lightweight dialog service to replace MatDialog
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DialogService {
  open(data: ConfirmDialogData): { afterClosed: () => Subject<boolean | undefined> } {
    const result$ = new Subject<boolean | undefined>();

    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    overlay.innerHTML = `
      <div class="dialog-panel" role="dialog" aria-modal="true">
        <h2 class="dialog-title">${data.title}</h2>
        <p class="dialog-message">${data.message}</p>
        <div class="dialog-actions">
          <button class="btn btn-secondary dialog-cancel">${data.cancelLabel ?? 'Cancel'}</button>
          <button class="btn btn-danger dialog-confirm">${data.confirmLabel ?? 'Confirm'}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('dialog-visible'));

    const close = (value: boolean | undefined) => {
      overlay.classList.remove('dialog-visible');
      setTimeout(() => overlay.remove(), 200);
      result$.next(value);
      result$.complete();
    };

    overlay.querySelector('.dialog-confirm')!.addEventListener('click', () => close(true));
    overlay.querySelector('.dialog-cancel')!.addEventListener('click', () => close(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(undefined); });

    return { afterClosed: () => result$ };
  }
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: ``
})
export class ConfirmDialogComponent {}
