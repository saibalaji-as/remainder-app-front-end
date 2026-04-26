import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentListComponent } from './pages/appointment-list/appointment-list.component';

const routes: Routes = [
  { path: '', component: AppointmentListComponent }
];

@NgModule({
  imports: [
    AppointmentListComponent,
    RouterModule.forChild(routes)
  ]
})
export class AppointmentsModule {}
