import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReminderLogComponent } from './pages/reminder-log/reminder-log.component';

const routes: Routes = [
  { path: '', component: ReminderLogComponent }
];

@NgModule({
  imports: [
    ReminderLogComponent,
    RouterModule.forChild(routes)
  ]
})
export class RemindersModule {}
