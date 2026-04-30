import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tenant } from '../models/tenant.model';
import { ApiService } from './api.service';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private _tenant$ = new BehaviorSubject<Tenant | null>(null);
  readonly tenant$ = this._tenant$.asObservable();

  constructor(private api: ApiService) {}

  get currentTenant(): Tenant | null {
    return this._tenant$.getValue();
  }

  get tenantId(): string {
    const id = this._tenant$.getValue()?.id;
    return id !== undefined ? String(id) : '';
  }

  loadTenant(): Observable<Tenant> {
    return this.api.get<Tenant>('/tenants/me').pipe(
      tap(tenant => this._tenant$.next(tenant))
    );
  }

  clearTenant(): void {
    this._tenant$.next(null);
  }
}
