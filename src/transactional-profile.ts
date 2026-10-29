import { Component } from '@angular/core';
import { AuraCellComponents } from '@aura-ng/cell';

@Component({
  selector: 'aml-transactional-profile',
  standalone: true,
  imports: [AuraCellComponents],
  template: `
    <header class="transaction-title">
      <h2>Transactional profile</h2>
      <p>1 September 2026・Based on declared data</p>
    </header>
    @for (section of sections; track section.title) {
      <section class="transaction-section" [attr.aria-label]="section.title">
        <h3>{{ section.title }}</h3>
        <div class="transaction-factors">
          @for (factor of section.factors; track factor.label) {
            <div class="transaction-factor">
              <div auraCell size="m" class="transaction-cell" twClass="outline-none">
                <div auraCellText>
                  <div auraCellTextLine><span auraCellCaption>{{ factor.label }}</span></div>
                  <div auraCellTextLine><span auraCellTitle [class.transaction-na]="factor.value === 'Not applicable'">{{ factor.value }}</span></div>
                </div>
              </div>
              @if (factor.risk) {
                <p class="transaction-risk" [class.high]="factor.risk === 'High risk'">
                  @if (factor.risk === 'High risk') { <img src="assets/transaction-warning.svg" width="16" height="16" alt=""> }
                  {{ factor.risk }}
                </p>
              }
              @if (!$last) { <img class="transaction-divider" [src]="'assets/' + section.divider" alt=""> }
            </div>
          }
        </div>
      </section>
    }
    <div class="transaction-spacer" aria-hidden="true"></div>
  `,
})
export class TransactionalProfilePage {
  readonly sections = [
    { title: 'Operations', divider: 'transaction-divider.svg', factors: [
      { label: 'Amount', value: '$600,001–$1,000,000', risk: '' },
      { label: 'Periodicity', value: 'Weekly', risk: '' },
      { label: 'Quantity', value: '201–400', risk: '' },
    ] },
    { title: 'Geographic', divider: 'transaction-geographic-divider.svg', factors: [
      { label: 'Origin of funds', value: 'Mexico', risk: 'High risk' },
      { label: 'Destination of funds', value: 'Mexico', risk: 'Low risk' },
      { label: 'Operations', value: 'Not applicable', risk: '' },
    ] },
  ];
}
