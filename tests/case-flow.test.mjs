import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
const output = mkdtempSync(join(tmpdir(), 'aml-case-flow-'));
execFileSync(resolve('node_modules/.bin/tsc'), ['src/case-model.ts','--outDir',output,'--target','ES2022','--module','commonjs','--skipLibCheck']);
const { createCases, createManagerCase, createComplianceCase, createComplianceDocumentsCase, casesForRole, advanceCase, validationError } = createRequire(import.meta.url)(join(output, 'case-model.js'));
process.on('exit', () => rmSync(output, { recursive:true, force:true }));
const ready = (item, patch) => ({ ...item, form: { ...item.form, checks: [true,true], ...patch } });

test('Starting EDD-1 keeps case identity and profile, without changing other cases', () => {
  const cases = createCases();
  const item = ready(cases[0], { decision:'true-positive', next:'edd1', followUp:'Verify source of funds' });
  const result = advanceCase(item);
  assert.equal(result.id, item.id);
  assert.equal(result.profile, item.profile);
  assert.equal(result.status, 'Documents request');
  assert.equal(result.edd, 1);
  assert.equal(result.lastFollowUp, 'Verify source of funds');
  assert.deepEqual(result.form.checks, [false,false]);
  assert.equal(cases[1].status,'Documents check');
  assert.equal(cases.length,3);
});
test('Incomplete review and missing escalation recipient cannot advance a case', () => {
  const item = createCases()[0];
  assert.ok(validationError(item)); assert.equal(advanceCase(item), item);
  const missingRecipient = ready(item,{decision:'true-positive', next:'escalate'});
  assert.match(validationError(missingRecipient), /who to escalate/);
  assert.equal(advanceCase(missingRecipient),missingRecipient);
});
test('False positive closes the initial case; escalation retains the intended recipient', () => {
  const item = createCases()[0];
  assert.equal(advanceCase(ready(item,{decision:'false-positive'})).status,'Closed');
  const result = advanceCase(ready(item,{decision:'true-positive',next:'escalate',escalateTo:'Compliance officer'}));
  assert.equal(result.status,'Escalated'); assert.equal(result.resolution,'Escalated to Compliance officer');
});
test('Documents review supports closure, clarification, EDD-2, and escalation', () => {
  const item = ready(createCases()[1], {documents:'provided'});
  assert.equal(advanceCase(ready(item,{decision:'not-suspicious'})).status,'Closed');
  assert.equal(advanceCase(ready(item,{decision:'clarification'})).status,'Waiting for clarification');
  const edd2 = advanceCase(ready(item,{decision:'edd2'}));
  assert.equal(edd2.status,'Documents request'); assert.equal(edd2.edd,2);
  assert.equal(advanceCase(ready(item,{decision:'escalate',escalateTo:'Manager'})).status,'Escalated');
});
test('Documents check requires a document choice and records a reminder for missing documents', () => {
  const item = createCases()[1];
  assert.match(validationError(ready(item,{})), /whether the client provided/);
  assert.ok(validationError(ready(item,{documents:'provided'})));
  const missing = ready(item,{documents:'missing',followUp:'Reminder sent via CRM chat'});
  const result = advanceCase(missing);
  assert.equal(result.id,item.id);
  assert.equal(result.status,'Waiting for documents');
  assert.equal(result.lastFollowUp,'Reminder sent via CRM chat');
  assert.ok(validationError(ready(item,{documents:'missing',decision:'clarification'})));
  const request = advanceCase(ready(item,{documents:'provided',decision:'edd2'}));
  assert.equal(advanceCase(ready(request,{})).status,'Waiting for documents');
});
test('The three cases have separate clients and drafts', () => {
  const cases = createCases();
  assert.equal(new Set(cases.map(item=>item.profile.companyId)).size,3);
  cases[0].form.checks[0]=true;
  assert.equal(cases[1].form.checks[0],false);
  assert.equal(cases[1].profile.supportingDocuments.length,3);
});

test('EDD-3 sends provided documents directly to compliance and retains the case identity', () => {
  const item = createCases()[2];
  assert.equal(item.edd,3);
  assert.ok(validationError(ready(item,{})));
  const provided = ready(item,{documents:'provided',followUp:'Documents attached to the case'});
  assert.equal(validationError(provided),'');
  const result = advanceCase(provided);
  assert.equal(result.id,item.id);
  assert.equal(result.profile,item.profile);
  assert.equal(result.edd,3);
  assert.equal(result.status,'Escalated');
  assert.equal(result.resolution,'Sent to the compliance officer');
  assert.equal(result.lastFollowUp,'Documents attached to the case');
  assert.equal(advanceCase(ready(item,{documents:'missing'})).status,'Waiting for documents');
  assert.ok(validationError(ready(item,{documents:'provided',decision:'edd2'})));
  assert.equal(createCases()[1].edd,1);
});

for (const [decision, status, resolution] of [
  ['de-escalate', 'De-escalated', 'De-escalated to the analyst'],
  ['escalate-compliance', 'Escalated', 'Escalated to the compliance officer'],
]) {
  test(`Manager ${decision} clears only the manager queue and retains follow-up`, () => {
    const analysts = createCases();
    const manager = ready(createManagerCase(), {decision, followUp:'Please verify the findings'});
    const items = [...analysts, manager];
    const completed = advanceCase(manager);
    assert.equal(completed.status,status);
    assert.equal(completed.resolution,resolution);
    assert.equal(completed.lastFollowUp,'Please verify the findings');
    assert.equal(completed.id,manager.id);
    const updated = items.map(item => item.id === completed.id ? completed : item);
    assert.deepEqual(casesForRole(updated,'Manager'),[]);
    assert.deepEqual(casesForRole(updated,'Analyst'),analysts);
    // Switching away and back cannot resurrect a completed manager case.
    assert.deepEqual(casesForRole(updated,'Compliance officer'),[]);
    assert.deepEqual(casesForRole(updated,'Manager'),[]);
    assert.equal(advanceCase(completed),completed);
  });
}
test('Manager queue requires both checklist items and one valid decision', () => {
  const manager = createManagerCase();
  const items = [...createCases(),manager];
  assert.deepEqual(casesForRole(items,'Manager'),[manager]);
  assert.equal(casesForRole(items,'Analyst').length,3);
  assert.ok(validationError(manager));
  assert.equal(advanceCase(manager),manager);
  assert.ok(validationError(ready(manager,{})));
  assert.ok(validationError(ready(manager,{decision:'edd2'})));
  assert.ok(validationError({...ready(manager,{decision:'de-escalate'}),form:{...manager.form,checks:[true,false],decision:'de-escalate'}}));
  assert.equal(validationError(ready(manager,{decision:'escalate-compliance'})),'');
});

test('Compliance EDD-3 retains case, client and role while moving to document request', () => {
  const item = createComplianceCase();
  const request = advanceCase(ready(item,{decision:'edd3',followUp:'Request additional source of funds documents'}));
  assert.equal(request.id,item.id);
  assert.equal(request.profile,item.profile);
  assert.equal(request.role,'Compliance officer');
  assert.equal(request.status,'Documents request');
  assert.equal(request.edd,3);
  assert.equal(request.lastFollowUp,'Request additional source of funds documents');
  assert.equal(request.form.decision,'');
  assert.deepEqual(request.form.checks,[false,false]);
  assert.deepEqual(casesForRole([request],'Compliance officer'),[request]);
  assert.equal(advanceCase(request),request);
  const waiting = advanceCase(ready(request,{}));
  assert.equal(waiting.status,'Waiting for documents');
  assert.deepEqual(casesForRole([waiting],'Compliance officer'),[]);
});
for (const [decision,status] of [
  ['not-suspicious','Closed'], ['suspicious-report','Closed'], ['escalate-ccc','Escalated'],
]) {
  test(`Compliance ${decision} removes the case and preserves other role queues`, () => {
    const others = [...createCases(),createManagerCase()];
    const item = createComplianceCase();
    const completed = advanceCase(ready(item,{decision,followUp:'Review completed',operationDescription:'Repeated incoming transfers',suspiciousReason:'Inconsistent with declared activity'}));
    assert.equal(completed.id,item.id);
    assert.equal(completed.status,status);
    assert.equal(completed.lastFollowUp,'Review completed');
    const updated = [...others,completed];
    assert.deepEqual(casesForRole(updated,'Compliance officer'),[]);
    assert.deepEqual(casesForRole(updated,'Analyst'),others.slice(0,3));
    assert.deepEqual(casesForRole(updated,'Manager'),[others[3]]);
    assert.equal(advanceCase(completed),completed);
    if (decision === 'suspicious-report') {
      assert.deepEqual(completed.report,{operationDescription:'Repeated incoming transfers',suspiciousReason:'Inconsistent with declared activity'});
    } else assert.equal(completed.report,undefined);
  });
}
test('Compliance review requires its own decision and complete checklist', () => {
  const item = createComplianceCase();
  assert.ok(validationError(item));
  assert.ok(validationError(ready(item,{})));
  for (const decision of ['de-escalate','edd2','clarification','escalate']) {
    const invalid = ready(item,{decision});
    assert.ok(validationError(invalid));
    assert.equal(advanceCase(invalid),invalid);
  }
  assert.deepEqual(casesForRole([item],'Compliance officer'),[item]);
  assert.equal(validationError(ready(item,{decision:'escalate-ccc'})),'');
});

test('Compliance has two independent cases and keeps drafts while switching between them', () => {
  const review = createComplianceCase();
  const documents = createComplianceDocumentsCase();
  assert.notEqual(review.id,documents.id);
  assert.notEqual(review.profile.companyId,documents.profile.companyId);
  assert.equal(documents.status,'Documents review');
  assert.equal(documents.edd,3);
  documents.form.followUp = 'Checked source of funds';
  documents.form.operationDescription = 'Documented transfer';
  documents.form.checks[0] = true;
  assert.equal(review.form.followUp,'');
  assert.equal(review.form.operationDescription,'');
  assert.equal(review.form.checks[0],false);
  assert.equal(documents.profile.supportingDocuments.length,3);
  assert.deepEqual(casesForRole([review,documents],'Compliance officer'),[review,documents]);
});
for (const [decision,status] of [
  ['not-suspicious','Closed'], ['suspicious-report','Closed'], ['escalate-ccc','Escalated'],
]) {
  test(`EDD-3 document review ${decision} removes only that case`, () => {
    const review = createComplianceCase();
    review.form.followUp = 'Keep this draft';
    const documents = createComplianceDocumentsCase();
    const completed = advanceCase(ready(documents,{decision,followUp:'Document review completed',operationDescription:'Cross-border transfers',suspiciousReason:'Source of funds not confirmed'}));
    assert.equal(completed.id,documents.id);
    assert.equal(completed.status,status);
    assert.equal(completed.edd,3);
    assert.equal(completed.lastFollowUp,'Document review completed');
    const remaining = casesForRole([review,completed],'Compliance officer');
    assert.deepEqual(remaining,[review]);
    assert.equal(remaining[0].form.followUp,'Keep this draft');
    if (decision === 'suspicious-report') assert.deepEqual(completed.report,{operationDescription:'Cross-border transfers',suspiciousReason:'Source of funds not confirmed'});
    const closedReview = advanceCase(ready(review,{decision:'not-suspicious'}));
    assert.deepEqual(casesForRole([closedReview,completed],'Compliance officer'),[]);
  });
}
test('EDD-3 document review rejects requesting EDD-3 again and requires a complete checklist', () => {
  const item = createComplianceDocumentsCase();
  assert.ok(validationError(item));
  assert.ok(validationError(ready(item,{})));
  const invalid = ready(item,{decision:'edd3'});
  assert.ok(validationError(invalid));
  assert.equal(advanceCase(invalid),invalid);
  assert.equal(validationError(ready(item,{decision:'escalate-ccc'})),'');
});
