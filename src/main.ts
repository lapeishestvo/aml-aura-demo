import { Component, computed, inject, input, signal } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CasePanel } from './case-panel';
import { createCases, advanceCase, validationError, type Person, type ReviewForm } from './case-model';
import { DocumentsPage } from './documents';
import { ProductsPage } from './products';
import { AuraCellComponents } from '@aura-ng/cell';
import { AuraBadgeDirective } from '@aura-ng/badge';
import { AuraButtonComponent } from '@aura-ng/button';
import { AuraModalComponents, AuraModalService, injectModalContext } from '@aura-ng/modal';


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
  imports: [AuraCellComponents, AuraBadgeDirective, CheckDetails, PeopleList, DocumentsPage, ProductsPage, CasePanel],
  templateUrl: './app.html',
})
class AmlApp {
  readonly active = signal('case');
  readonly cases = signal(createCases());
  readonly selectedCaseId = signal('AML-2026-001');
  readonly currentCase = computed(() => this.cases().find(item => item.id === this.selectedCaseId())!);
  readonly profile = computed(() => this.currentCase().profile);
  readonly copied = signal(false);
  readonly reportNotice = signal(false);
  readonly panelError = signal('');
  readonly navigation = [
    { id: 'case', label: 'Case' }, { id: 'company-profile', label: 'Company profile' },
    { id: 'documents', label: 'Documents' }, { id: 'products', label: 'Products' },
    { id: 'risk-matrix', label: 'Risk matrix' }, { id: 'transactional-profile', label: 'Transactional profile' },
    { id: 'section-7', label: '' },
  ];
  readonly mainInfo = computed(() => {
    const p = this.profile();
    return [
      { label: 'Legal name', value: p.legalName }, { label: 'Trade name', value: p.company },
      { label: 'Company type', value: 'Persona Moral' }, { label: 'Legal form', value: p.legalName.includes('S. de R.L.') ? 'Sociedad de Responsabilidad Limitada de Capital Variable' : 'Sociedad Anónima de Capital Variable (S.A. de C.V.)' },
      { label: 'Economic Activities', value: p.activity }, { label: 'Date of incorporation', value: p.incorporated },
      { label: 'Registration city', value: p.city }, { label: 'Registration number', value: p.registration },
      { label: 'RFC', value: p.rfc }, { label: 'Number of employees', value: p.employees },
    ];
  });
  readonly addressLabels = ['Primary', 'Legal', 'Inegi'];
  selectCase(id: string): void { this.selectedCaseId.set(id); this.panelError.set(''); this.copied.set(false); this.reportNotice.set(false); }
  updateForm(patch: Partial<ReviewForm>): void {
    this.cases.update(items => items.map(item => item.id === this.selectedCaseId() ? { ...item, form: { ...item.form, ...patch } } : item));
    this.panelError.set('');
  }
  submitCase(): void {
    const item = this.currentCase();
    const error = validationError(item);
    this.panelError.set(error);
    if (!error) this.cases.update(items => items.map(candidate => candidate.id === item.id ? advanceCase(candidate) : candidate));
  }
  select(event: MouseEvent, id: string): void { event.preventDefault(); this.active.set(id); }
  async copyId(): Promise<void> {
    try { await navigator.clipboard.writeText(this.profile().companyId); this.copied.set(true); setTimeout(() => this.copied.set(false), 2000); }
    catch { this.copied.set(false); }
  }
}
bootstrapApplication(AmlApp).catch(console.error);
