import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

const routes: Routes = [
  { path: '', component: DashboardComponent }
];

@NgModule({
  imports: [
    DashboardComponent,
    RouterModule.forChild(routes)
  ]
})
export class DashboardModule {}
