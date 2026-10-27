import { Component, computed, input, signal } from '@angular/core';
import { AuraBadgeDirective } from '@aura-ng/badge';
import { AuraButtonComponent } from '@aura-ng/button';
import { AuraTableComponents } from '@aura-ng/table';
import { AuraTooltipComponents } from '@aura-ng/tooltip';

import { createCases, type Account } from './case-model';

@Component({
  selector: 'aml-account-table', standalone: true,
  imports: [AuraTableComponents, AuraBadgeDirective, AuraTooltipComponents],
  template: `
    <table auraTable [columns]="columns" class="accounts-table" [attr.aria-label]="label()">
      <thead auraTableHeader [sticky]="false"><tr auraTableHeaderRow>
        <th auraTableHeaderCell>Account</th><th auraTableHeaderCell>Opened</th><th auraTableHeaderCell>Level</th><th auraTableHeaderCell class="numeric">Amount</th><th auraTableHeaderCell class="numeric">Status</th>
      </tr></thead>
      <tbody auraTableBody>
        @for (account of accounts(); track account.id) {
          <tr auraTableRow [class.with-reason]="account.reason">
            <td auraTableCell><div class="account-text"><span>{{ account.name }}</span>
              <button type="button" class="copy-account" (click)="copy(account.id)" [attr.aria-label]="'Copy internal ID of ' + account.name"><img src="assets/7848-46607-imgLeftIcon.svg" width="12" height="12" alt="">{{ copied() === account.id ? 'Copied' : 'Copy internal ID' }}</button>
            </div></td>
            <td auraTableCell>{{ account.opened }}</td>
            <td auraTableCell><span class="account-level">4 <button type="button" class="account-info" auraTooltip="Regulatory limit $1,000,000" auraTooltipPosition="top" auraTooltipSize="m" aria-label="Regulatory limit"><img src="assets/7848-46609-imgDuotoneInfo.svg" width="20" height="20" alt=""></button></span></td>
            <td auraTableCell class="numeric"><div class="account-text"><span>{{ account.amount }}</span>@if (account.overdraft) { <span class="account-note">Overdraft limit {{ account.overdraft }}</span> }</div></td>
            <td auraTableCell class="numeric"><div class="account-text status-text">
              <span auraBadge size="m" [appearance]="account.status === 'Active' ? 'success' : 'neutral'" [surface]="account.status === 'Pending closure' ? 'secondary' : 'tertiary'" [class.closed-badge]="account.status === 'Closed'">{{ account.status }}</span>
              @if (account.reason) { <span class="account-note">20 Oct 2025<br>{{ account.reason }}</span> }
            </div></td>
          </tr>
        }
      </tbody>
    </table>`,
})
export class AccountTable {
  readonly accounts = input.required<Account[]>();
  readonly label = input.required<string>();
  readonly columns = ['minmax(140px, 1fr)', '120px', '64px', 'minmax(140px, 1fr)', '176px'];
  readonly copied = signal('');
  async copy(id: string): Promise<void> {
    try {
      try { await navigator.clipboard.writeText(id); }
      catch {
        const previous = document.activeElement as HTMLElement | null;
        const field = document.createElement('textarea');
        field.value = id;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.append(field);
        field.select();
        const success = document.execCommand('copy');
        field.remove();
        previous?.focus({ preventScroll: true });
        if (!success) throw new Error('Copy failed');
      }
      this.copied.set(id);
      setTimeout(() => this.copied.set(''), 2000);
    } catch { this.copied.set(''); }
  }
}

@Component({
  selector: 'aml-products', standalone: true,
  imports: [AuraBadgeDirective, AuraButtonComponent, AccountTable],
  host: { class: 'products-page' },
  template: `
    <div class="page-title"><h2>Products</h2></div>
    <section class="product-group">
      <header class="product-header"><h3>Persona Moral business account</h3><div class="product-counts">
        <span auraBadge appearance="success" surface="tertiary" size="m">{{ activeCount() }} active</span>
        @if (pendingCount()) { <span auraBadge appearance="neutral" surface="secondary" size="m">{{ pendingCount() }} pending closure</span> }
        @if (closedCount()) { <span auraBadge appearance="neutral" surface="tertiary" size="m" class="closed-badge">{{ closedCount() }} closed</span> }
      </div><button auraButton size="s" appearance="tertiary" class="collapse-group" (click)="businessOpen.set(!businessOpen())" [attr.aria-expanded]="businessOpen()" aria-controls="business-accounts" aria-label="Toggle Persona Moral business accounts"><img src="assets/7848-46537-imgButtonIcon.svg" width="24" height="24" [class.rotated]="!businessOpen()" alt=""></button></header>
      @if (businessOpen()) { <div id="business-accounts" class="accounts-scroll">
        <aml-account-table label="Persona Moral business accounts" [accounts]="showAll() ? businessAccounts() : businessAccounts().slice(0, 4)" />
        @if (businessAccounts().length > 4) { <button auraButton appearance="tertiary" size="m" class="show-more" (click)="showAll.set(!showAll())" [attr.aria-expanded]="showAll()">{{ showAll() ? 'Show less' : 'Show ' + (businessAccounts().length - 4) + ' more' }}<img src="assets/7848-46537-imgStrokeChevronDown.svg" width="20" height="20" [class.rotated]="showAll()" alt=""></button> }
      </div> }
    </section>
    <section class="product-group apartado-group">
      <header class="product-header"><h3>Apartado</h3><div class="product-counts"><span auraBadge appearance="success" surface="tertiary" size="m">{{ apartadoAccounts().length }} active</span></div><button auraButton size="s" appearance="tertiary" class="collapse-group" (click)="apartadoOpen.set(!apartadoOpen())" [attr.aria-expanded]="apartadoOpen()" aria-controls="apartado-accounts" aria-label="Toggle Apartado accounts"><img src="assets/7848-46537-imgButtonIcon.svg" width="24" height="24" [class.rotated]="!apartadoOpen()" alt=""></button></header>
      @if (apartadoOpen()) { <div id="apartado-accounts" class="accounts-scroll"><aml-account-table label="Apartado accounts" [accounts]="apartadoAccounts()" /></div> }
    </section>
    <div class="page-spacer"></div>`,
})
export class ProductsPage {
  readonly businessOpen = signal(true);
  readonly apartadoOpen = signal(true);
  readonly showAll = signal(false);
  readonly businessAccounts = input<Account[]>(createCases()[0].profile.accounts);
  readonly apartadoAccounts = input<Account[]>(createCases()[0].profile.apartado);
  readonly activeCount = computed(() => this.businessAccounts().filter(item => item.status === 'Active').length);
  readonly pendingCount = computed(() => this.businessAccounts().filter(item => item.status === 'Pending closure').length);
  readonly closedCount = computed(() => this.businessAccounts().filter(item => item.status === 'Closed').length);
}
