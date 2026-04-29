import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { PwaService } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-update-notification',
  standalone: true,
  imports: [MatSnackBarModule],
  template: `<!-- Update notification is rendered via MatSnackBar, no template needed -->`,
})
export class UpdateNotificationComponent implements OnInit, OnDestroy {
  private readonly pwaService = inject(PwaService);
  private readonly snackBar = inject(MatSnackBar);
  private subscription: Subscription | null = null;

  ngOnInit(): void {
    this.subscription = this.pwaService.updateAvailable$
      .pipe(filter(available => available))
      .subscribe(() => {
        const snackBarRef = this.snackBar.open(
          'A new version of Schedify is available.',
          'Reload',
          {
            duration: 0, // Persist until user acts
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            panelClass: ['pwa-update-snackbar']
          }
        );

        snackBarRef.onAction().subscribe(() => {
          document.location.reload();
        });
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
