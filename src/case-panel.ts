import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuraCellComponents } from '@aura-ng/cell';
import { AuraButtonComponent } from '@aura-ng/button';
import { AuraCheckboxComponent } from '@aura-ng/checkbox';
import { AuraRadioButtonDirective } from '@aura-ng/radio-button';
import { AuraFormFieldComponents } from '@aura-ng/form-field-v2';
import { AuraInputComponents } from '@aura-ng/input-v2';
import { AuraSelectComponents } from '@aura-ng/select-v2';
import { AuraListboxComponents } from '@aura-ng/listbox';
import { isEscalation, type ReviewCase, type ReviewForm, type Decision } from './case-model';

@Component({
  selector: 'aml-case-panel', standalone: true,
  imports: [FormsModule, AuraCellComponents, AuraButtonComponent, AuraCheckboxComponent, AuraRadioButtonDirective, AuraFormFieldComponents, AuraInputComponents, AuraSelectComponents, AuraListboxComponents],
  templateUrl: './case-panel.html',
})
export class CasePanel {
  readonly item = input.required<ReviewCase>();
  readonly error = input('');
  readonly formChange = output<Partial<ReviewForm>>();
  readonly submitted = output<void>();
  readonly manager = computed(() => this.item().status === 'Manager review');
  readonly managerChoices = [
    {value: 'de-escalate' as Decision, label: 'De-escalate to the analyst'},
    {value: 'escalate-compliance' as Decision, label: 'Escalate to the compliance officer'},
  ];
  readonly initial = computed(() => this.item().status === 'Initial review');
  readonly requesting = computed(() => this.item().status === 'Documents request');
  readonly waiting = computed(() => ['Waiting for documents', 'Waiting for clarification'].includes(this.item().status));
  readonly finished = computed(() => ['Closed', 'Escalated', 'De-escalated'].includes(this.item().status));
  readonly escalating = computed(() => isEscalation(this.item().form));
  readonly documentsCheck = computed(() => this.item().status === 'Documents check');
  readonly finalDocumentsCheck = computed(() => this.documentsCheck() && this.item().edd === 3);
  readonly documentChoices = [
    { value: 'provided' as const, label: 'Client provided documents' },
    { value: 'missing' as const, label: 'No documents from the client' },
  ];
  readonly options = computed(() => [
    { value: 'not-suspicious' as Decision, label: 'Client is no longer suspicious' },
    { value: 'clarification' as Decision, label: 'Request client’s clarification' },
    { value: 'edd2' as Decision, label: 'Request additional documents (EDD-2)' },
    { value: 'escalate' as Decision, label: 'Escalate case' },
  ]);
  readonly hint = computed(() => this.finalDocumentsCheck() && this.item().form.documents === 'provided'
    ? 'Upload the provided documents in the case and send the case to the compliance officer'
    : this.documentsCheck() && this.item().form.documents === 'missing'
    ? 'Send the reminder via CRM chat'
    : this.documentsCheck() && this.item().form.decision === 'clarification'
      ? 'Ask the client for clarification via CRM chat' : '');
  readonly buttonLabel = computed(() => {
    const item = this.item();
    if (this.manager()) return item.form.decision === 'de-escalate' ? 'De-escalate case' : item.form.decision === 'escalate-compliance' ? 'Escalate case' : 'Continue';
    if (this.finalDocumentsCheck() && item.form.documents === 'provided') return 'Send case to the compliance officer';
    if (this.requesting()) return 'Request documents';
    if (this.escalating()) return 'Escalate case';
    if (item.form.decision === 'false-positive' || item.form.decision === 'not-suspicious') return 'Close case';
    if (item.form.decision === 'true-positive' && item.form.next === 'edd1') return 'Start EDD1';
    if (item.form.decision === 'edd2') return 'Start EDD-2';
    return 'Continue';
  });
  readonly escalationTargets = ['Manager', 'Compliance officer'];
  changeDecision(decision: Decision): void { this.formChange.emit({ decision, next: '', escalateTo: '' }); }
  changeCheck(index: number, checked: boolean): void {
    const checks = [...this.item().form.checks]; checks[index] = checked; this.formChange.emit({ checks });
  }
}
