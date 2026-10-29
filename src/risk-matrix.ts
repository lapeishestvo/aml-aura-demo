import { Component } from '@angular/core';
import { AuraTableComponents } from '@aura-ng/table';

@Component({
  selector: 'aml-risk-matrix', standalone: true,
  imports: [AuraTableComponents],
  template: `
    <header class="risk-summary">
      <div><h2>Medium risk level</h2><p>1 September 2026</p></div>
      <div class="risk-gauge" role="img" aria-label="Risk score 3.46, medium risk">
        <img class="gauge-green" src="assets/risk-green.svg" alt="">
        <img class="gauge-yellow" src="assets/risk-yellow.svg" alt="">
        <img class="gauge-red" src="assets/risk-red.svg" alt="">
        <div class="gauge-marker-wrapper"><div class="gauge-marker"><img src="assets/risk-marker.svg" alt=""></div></div>
        <span class="gauge-value">3.46</span>
      </div>
    </header>
    @for (section of sections; track section.title) {
      <section class="risk-section" [attr.aria-label]="section.title">
        <h3>{{ section.title }}</h3>
        <table auraTable [columns]="columns" class="risk-table" [attr.aria-label]="section.title + ' risk factors'">
          <thead auraTableHeader [sticky]="false"><tr auraTableHeaderRow>
            <th auraTableHeaderCell>Risk factor</th><th auraTableHeaderCell>Value</th>
            <th auraTableHeaderCell class="risk-number">Weight</th><th auraTableHeaderCell class="risk-number">Score</th>
          </tr></thead>
          <tbody auraTableBody>
            @for (row of section.rows; track row.factor) {
              <tr auraTableRow>
                <td auraTableCell>{{ row.factor }}</td>
                <td auraTableCell><span class="risk-value" [class.risk-high]="row.value === 'High risk'" [class.risk-low]="row.value === 'Low risk'">
                  @if (row.value === 'High risk') { <img src="assets/transaction-warning.svg" alt="" width="16" height="16"> }
                  {{ row.value }}
                </span></td>
                <td auraTableCell class="risk-number">{{ row.weight }} %</td>
                <td auraTableCell class="risk-number">{{ row.score }}</td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    }
  `,
})
export class RiskMatrixPage {
  readonly columns = ['minmax(0, 1fr)', 'minmax(0, 1fr)', '72px', '64px'];
  readonly sections = [
    {title: 'Inherent', rows: [
      {factor: 'Type of person', value: 'Persona Moral', weight: 2, score: 2},
      {factor: 'PEP related', value: 'No', weight: 15, score: 0},
      {factor: 'Country', value: 'Mexico', weight: 5, score: 1},
      {factor: 'Time since incorporation', value: '< 1 year', weight: 4, score: 1},
      {factor: 'Business or economic activity', value: 'High risk', weight: 10, score: 4},
      {factor: 'Geographic location or geolocation', value: 'Low risk', weight: 8, score: 1},
      {factor: 'Products and services', value: 'Deposits and savings\nTime deposits\nRevolving credit\nLoans\nFactoring\nOverdrafts\nPayroll payments\nInternational transfers', weight: 8, score: 2},
    ]},
    {title: 'Transaction', rows: [
      {factor: 'Transaction volume', value: '$200,001–$600,001', weight: 8, score: 3},
      {factor: 'Frequency of the operation', value: 'Weekly', weight: 10, score: 1},
      {factor: 'Source of funds', value: 'Personal money\nBusiness income\nCredit / borrowed money\nOther sources', weight: 4, score: 1},
      {factor: 'Destination of funds', value: 'Operating expenses\nPayroll payment\nInvestments\nBusiness development\nDonations and social responsibility', weight: 4, score: 1},
      {factor: 'Funds origin geolocation', value: 'High risk', weight: 2, score: 1},
      {factor: 'Funds destination geolocation', value: 'Low risk', weight: 2, score: 1},
      {factor: 'Handling cash', value: '> 20% of total volume', weight: 8, score: 3},
      {factor: 'Device geolocation', value: 'Not applicable', weight: 6, score: 0},
    ]},
  ];
}
