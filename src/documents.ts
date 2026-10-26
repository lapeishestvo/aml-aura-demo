import { Component, signal } from '@angular/core';
import { AuraCellComponents } from '@aura-ng/cell';
import { AuraButtonComponent } from '@aura-ng/button';

@Component({
  selector: 'aml-documents', standalone: true,
  imports: [AuraCellComponents, AuraButtonComponent],
  host: { class: 'documents-page' },
  template: `
    <div class="page-title"><h2>Documents</h2></div>
    <section class="info-section"><h3>Company documents</h3><div class="document-list">
      @for (document of documents; track document) {
        <div auraCell size="m" class="document-cell" twClass="outline-none">
          <span auraCellStart><img src="assets/6993-56381-imgContent.svg" width="32" height="32" alt=""></span>
          <span auraCellText><span auraCellTextLine><span auraCellTitle>{{ document }}</span></span></span>
          <span auraCellEnd><button auraButton appearance="tertiary" size="s" class="download-document" [attr.aria-label]="'Download ' + document" (click)="notice.set(document)"><img src="assets/6993-56381-imgButtonIcon.svg" width="20" height="20" alt=""></button></span>
        </div>
      }
      @if (notice()) { <p class="document-notice" role="status">{{ notice() }}: no file is attached in this demo.</p> }
    </div></section>
    <section class="info-section"><h3>Supporting documents</h3><p class="empty-documents">Nothing yet</p></section>
    <div class="page-spacer"></div>`,
})
export class DocumentsPage {
  readonly documents = ['Certificate', 'Certificate of inscription rpc', 'Company address proof'];
  readonly notice = signal('');
}
