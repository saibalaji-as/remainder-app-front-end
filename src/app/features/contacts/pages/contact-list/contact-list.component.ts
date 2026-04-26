import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Contact, ContactCreateDto } from '../../../../core/models/contact.model';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatPaginatorModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.scss']
})
export class ContactListComponent implements OnInit, OnDestroy {
  contacts: Contact[] = [];
  filteredContacts: Contact[] = [];
  displayedColumns = ['name', 'email', 'phone', 'actions'];
  loading = false;
  showAddForm = false;
  csvPreviewRows: string[][] = [];
  csvHeaders: string[] = [];

  pageSize = 10;
  pageIndex = 0;

  addForm = this.fb.group({
    name:  ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required]
  });

  searchControl = this.fb.control('');

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private toast: ToastService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadContacts();
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => this.filterContacts(term ?? ''));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadContacts(): void {
    this.loading = true;
    this.api.get<Contact[]>('/contacts').subscribe({
      next: (data) => {
        this.contacts = data;
        this.filteredContacts = data;
        this.loading = false;
      },
      error: () => {
        this.toast.error('Failed to load contacts.');
        this.loading = false;
      }
    });
  }

  filterContacts(term: string): void {
    const lower = term.toLowerCase();
    this.filteredContacts = this.contacts.filter(c =>
      c.name.toLowerCase().includes(lower) ||
      c.email.toLowerCase().includes(lower) ||
      c.phone.includes(lower)
    );
    this.pageIndex = 0;
  }

  get pagedContacts(): Contact[] {
    const start = this.pageIndex * this.pageSize;
    return this.filteredContacts.slice(start, start + this.pageSize);
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  submitAdd(): void {
    if (this.addForm.invalid) return;
    const dto = this.addForm.value as ContactCreateDto;
    this.api.post<Contact>('/contacts', dto).subscribe({
      next: () => {
        this.toast.success('Contact added.');
        this.addForm.reset();
        this.showAddForm = false;
        this.loadContacts();
      },
      error: () => this.toast.error('Failed to add contact.')
    });
  }

  deleteContact(contact: Contact): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Contact', message: `Delete ${contact.name}?`, confirmLabel: 'Delete' }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.delete(`/contacts/${contact.id}`).subscribe({
          next: () => { this.toast.success('Contact deleted.'); this.loadContacts(); },
          error: () => this.toast.error('Failed to delete contact.')
        });
      }
    });
  }

  onCsvFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      this.csvHeaders = lines[0].split(',').map(h => h.trim());
      this.csvPreviewRows = lines.slice(1, 6).map(l => l.split(',').map(v => v.trim()));
    };
    reader.readAsText(file);
  }

  confirmCsvImport(): void {
    // Bulk import: POST each row as a contact
    const nameIdx = this.csvHeaders.findIndex(h => h.toLowerCase() === 'name');
    const emailIdx = this.csvHeaders.findIndex(h => h.toLowerCase() === 'email');
    const phoneIdx = this.csvHeaders.findIndex(h => h.toLowerCase() === 'phone');

    if (nameIdx === -1 || emailIdx === -1 || phoneIdx === -1) {
      this.toast.error('CSV must have name, email, and phone columns.');
      return;
    }

    const requests = this.csvPreviewRows.map(row =>
      this.api.post<Contact>('/contacts', {
        name: row[nameIdx],
        email: row[emailIdx],
        phone: row[phoneIdx]
      })
    );

    let completed = 0;
    requests.forEach(req => req.subscribe({
      next: () => {
        completed++;
        if (completed === requests.length) {
          this.toast.success(`${completed} contacts imported.`);
          this.csvPreviewRows = [];
          this.csvHeaders = [];
          this.loadContacts();
        }
      },
      error: () => this.toast.error('Failed to import one or more contacts.')
    }));
  }
}
