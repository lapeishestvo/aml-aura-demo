import { Component, inject, input, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { DocumentsPage } from './documents';
import { ProductsPage } from './products';
import { AuraCellComponents } from '@aura-ng/cell';
import { AuraBadgeDirective } from '@aura-ng/badge';
import { AuraButtonComponent } from '@aura-ng/button';
import { AuraModalComponents, AuraModalService, injectModalContext } from '@aura-ng/modal';

interface Person { name: string; description: string; match: boolean; shares?: string; }

@Component({
  selector: 'aml-check-details', standalone: true,
  template: `<dl class="fields check-fields">
    @for (check of checks; track check.label) {
      <div class="field-row"><dt>{{ check.label }}</dt><dd [class.match]="check.match">
        @if (check.match) { <img [src]="'assets/' + assetPrefix() + '-imgStrokeWarning.svg'" alt="" width="16" height="16"> }
        {{ check.match ? 'Match' : 'No match' }}
      </dd></div>
    }
  </dl>`,
})
class CheckDetails {
  readonly assetPrefix = input('7168-37907');
  readonly checks = ['PEP', 'Secondary PEP', 'Additional segments', 'Enforcement match', 'Adverse media', 'Sanctions match', 'LPB Match'].map((label, i) => ({ label, match: i === 1 || i === 3 }));
}

@Component({
  standalone: true,
  imports: [AuraModalComponents, AuraBadgeDirective, AuraButtonComponent, CheckDetails],
  host: { class: 'lexis-modal', 'data-node-id': '7260:57657' },
  template: `
    <header class="modal-header">
      <div class="modal-heading"><div class="heading-line">
        <h2 auraModalAriaLabel>Lexis Nexis check</h2>
        <span auraBadge surface="tertiary" [appearance]="ctx.data.match ? 'error' : 'success'" size="m">{{ ctx.data.match ? 'Match' : 'No match' }}</span>
      </div><p class="modal-subtitle">{{ ctx.data.name }}</p></div>
      <button auraButton appearance="tertiary" size="s" class="close-button" aria-label="Close" (click)="ctx.close()"><img src="assets/7260-57657-imgStrokeCloseSmall.svg" width="20" height="20" alt=""></button>
    </header>
    <div class="modal-content"><aml-check-details assetPrefix="7260-57657" />
      <button class="text-link" type="button" (click)="linkNotice.set(true)">Open check in Lexis Nexis <img src="assets/7260-57657-imgRightIcon.svg" width="16" height="16" alt=""></button>
      @if (linkNotice()) { <p class="demo-notice" role="status">The external report is not connected in this demo.</p> }
    </div>
    <footer class="modal-footer"><button auraButton appearance="secondary" size="m" (click)="ctx.close()">Cancel</button></footer>
  `,
})
class LexisModal {
  readonly ctx = injectModalContext<Person>();
  readonly linkNotice = signal(false);
}

@Component({
  selector: 'aml-people', standalone: true,
  imports: [AuraCellComponents, AuraBadgeDirective],
  template: `<div class="people-list">
    @for (person of people(); track person.name) {
      <div auraCell size="m" class="person-cell" twClass="outline-none">
        <span auraCellStart><img [src]="'assets/' + assetPrefix() + '-imgContent.svg'" width="32" height="32" alt=""></span>
        <div auraCellText><div auraCellTextLine>
          <div class="person-title" auraCellTitle><span>{{ person.name }}</span>
            <button auraBadge surface="tertiary" [appearance]="person.match ? 'error' : 'success'" size="s" class="ln-badge"
              [attr.aria-label]="'Lexis Nexis check for ' + person.name + ': ' + (person.match ? 'Match' : 'No match')"
              aria-haspopup="dialog" (click)="open(person)">
              @if (person.match) { <img [src]="'assets/' + assetPrefix() + '-imgStrokeWarning.svg'" width="12" height="12" alt=""> }
              {{ person.match ? 'LN Match' : 'LN No match' }}
              <img [src]="'assets/' + assetPrefix() + (person.match ? '-imgStrokeInfoCircle1.svg' : '-imgStrokeInfoCircle.svg')" width="12" height="12" alt="">
            </button>
          </div>
          @if (person.shares) { <span auraCellTitleEnd>{{ person.shares }}</span> }
        </div><div auraCellTextLine><span auraCellDescription>{{ person.description }}</span></div></div>
      </div>
    }
  </div>`,
})
class PeopleList {
  readonly people = input.required<Person[]>();
  readonly assetPrefix = input.required<string>();
  private readonly modal = inject(AuraModalService);
  open(person: Person): void { this.modal.open(LexisModal, { data: person }); }
}

@Component({
  selector: 'aml-root', standalone: true,
  imports: [AuraCellComponents, AuraBadgeDirective, CheckDetails, PeopleList, DocumentsPage, ProductsPage],
  templateUrl: './app.html',
})
class AmlApp {
  readonly active = signal('company-profile');
  readonly copied = signal(false);
  readonly reportNotice = signal(false);
  readonly navigation = [
    { id: 'section-1', label: '' }, { id: 'company-profile', label: 'Company profile' },
    { id: 'risk-matrix', label: 'Risk matrix' }, { id: 'transactional-profile', label: 'Transactional profile' },
    { id: 'documents', label: 'Documents' }, { id: 'section-6', label: '' },
    { id: 'products', label: 'Products' }, { id: 'section-8', label: '' }, { id: 'section-9', label: '' },
  ];
  readonly mainInfo = [
    { label: 'Legal name', value: 'Comercializadora Monteverde, S.A. de C.V.' },
    { label: 'Trade name', value: 'Monteverde Suministros' },
    { label: 'Company type', value: 'Persona Moral' },
    { label: 'Legal form', value: 'Sociedad Anónima de Capital Variable (S.A. de C.V.)' },
    { label: 'Economic Activities', value: 'Wholesale of office supplies and equipment' },
    { label: 'Date of incorporation', value: '18 Mar 2016', note: '10 years, 6 months ago' },
    { label: 'Registration city', value: 'Ciudad de México, Mexico' },
    { label: 'Registration number', value: '123456' },
    { label: 'RFC', value: 'ABC240315KX7' }, { label: 'Number of employees', value: '48' },
  ];
  readonly addressLabels = ['Primary', 'Legal', 'Inegi'];
  readonly address = 'Av. Insurgentes Sur 1647, San José Insurgentes, CDMX, C.P. 03900';
  readonly shareholders: Person[] = [
    { name: 'Alejandro García Mendoza', description: 'Mexico, Male, 14 May 1978', match: false, shares: '45%, 4,500 shares' },
    { name: 'María Fernanda López Ruiz', description: 'Mexico, Female, 22 Sep 1982', match: false, shares: '55%, 5,500 shares' },
  ];
  readonly ubo: Person[] = [
    { ...this.shareholders[0], shares: undefined }, { ...this.shareholders[1], shares: undefined, match: true },
    { name: 'Carlos Alberto Herrera Sánchez', description: 'Mexico, Male, 08 Nov 1975', match: false },
    { name: 'Lucía Isabel Torres Vega', description: 'Mexico, Female, 03 Feb 1980', match: false },
  ];
  readonly representatives: Person[] = [
    { ...this.ubo[0] }, { name: 'Patricia Elena Ramírez Castro', description: 'Mexico, Female, 17 Jul 1986', match: false },
  ];
  select(event: MouseEvent, id: string): void { event.preventDefault(); this.active.set(id); }
  async copyId(): Promise<void> {
    try { await navigator.clipboard.writeText('78767654678927'); this.copied.set(true); setTimeout(() => this.copied.set(false), 2000); }
    catch { this.copied.set(false); }
  }
}
bootstrapApplication(AmlApp).catch(console.error);
