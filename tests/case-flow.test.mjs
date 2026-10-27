import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
const output = mkdtempSync(join(tmpdir(), 'aml-case-flow-'));
execFileSync(resolve('node_modules/.bin/tsc'), ['src/case-model.ts','--outDir',output,'--target','ES2022','--module','commonjs','--skipLibCheck']);
const { createCases, advanceCase, validationError } = createRequire(import.meta.url)(join(output, 'case-model.js'));
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
  assert.equal(cases[1].status,'Documents review');
  assert.equal(cases[2].status,'Client didn’t provide documents');
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
  const item = createCases()[1];
  assert.equal(advanceCase(ready(item,{decision:'not-suspicious'})).status,'Closed');
  assert.equal(advanceCase(ready(item,{decision:'clarification'})).status,'Waiting for clarification');
  const edd2 = advanceCase(ready(item,{decision:'edd2'}));
  assert.equal(edd2.status,'Documents request'); assert.equal(edd2.edd,2);
  assert.equal(advanceCase(ready(item,{decision:'escalate',escalateTo:'Manager'})).status,'Escalated');
});
test('Missing documents does not offer clarification; requests await client documents', () => {
  const item = createCases()[2];
  assert.ok(validationError(ready(item,{decision:'clarification'})));
  assert.equal(advanceCase(ready(item,{decision:'not-suspicious'})).status,'Closed');
  const request = advanceCase(ready(item,{decision:'edd2'}));
  assert.equal(advanceCase(ready(request,{})).status,'Waiting for documents');
});
test('The three cases have separate clients and drafts', () => {
  const cases = createCases();
  assert.equal(new Set(cases.map(item=>item.profile.companyId)).size,3);
  cases[0].form.checks[0]=true;
  assert.equal(cases[1].form.checks[0],false);
  assert.equal(cases[2].form.checks[0],false);
  assert.equal(cases[1].profile.supportingDocuments.length,3);
  assert.equal(cases[2].profile.supportingDocuments.length,0);
});
