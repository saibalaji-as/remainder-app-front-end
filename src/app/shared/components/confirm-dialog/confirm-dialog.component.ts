import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  open(data: ConfirmDialogData): { afterClosed: () => Subject<boolean | undefined> } {
    const result$ = new Subject<boolean | undefined>();

    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const panel = document.createElement('div');
    panel.className = 'dialog-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    const title = document.createElement('h2');
    title.className = 'dialog-title';
    title.textContent = data.title;

    const message = document.createElement('p');
    message.className = 'dialog-message';
    message.textContent = data.message;

    const actions = document.createElement('div');
    actions.className = 'dialog-actions';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-secondary dialog-cancel';
    cancelButton.textContent = data.cancelLabel ?? 'Cancel';

    const confirmButton = document.createElement('button');
    confirmButton.className = 'btn btn-danger dialog-confirm';
    confirmButton.textContent = data.confirmLabel ?? 'Confirm';

    actions.append(cancelButton, confirmButton);
    panel.append(title, message, actions);
    overlay.appendChild(panel);

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('dialog-visible'));

    const close = (value: boolean | undefined) => {
      overlay.classList.remove('dialog-visible');
      setTimeout(() => overlay.remove(), 200);
      result$.next(value);
      result$.complete();
    };

    confirmButton.addEventListener('click', () => close(true));
    cancelButton.addEventListener('click', () => close(false));
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
