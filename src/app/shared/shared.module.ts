import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    ConfirmDialogComponent
  ],
  exports: [
    CommonModule,
    LoadingSpinnerComponent,
    ConfirmDialogComponent
  ]
})
export class SharedModule {}
