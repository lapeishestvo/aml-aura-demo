export type CaseStatus = 'Initial review' | 'Documents request' | 'Documents check' | 'Waiting for documents' | 'Waiting for clarification' | 'Closed' | 'Escalated';
export type Decision = '' | 'true-positive' | 'false-positive' | 'not-suspicious' | 'clarification' | 'edd2' | 'escalate';
export interface ReviewForm { checks: boolean[]; decision: Decision; next: '' | 'edd1' | 'escalate'; documents: '' | 'provided' | 'missing'; escalateTo: string; followUp: string; }
export interface Person { name: string; description: string; match: boolean; shares?: string; }
export interface Account { id: string; name: string; status: 'Active' | 'Pending closure' | 'Closed'; overdraft?: string; reason?: string; amount: string; opened: string; }
export interface ClientProfile { company: string; legalName: string; companyId: string; rfc: string; registration: string; city: string; address: string; activity: string; incorporated: string; employees: string; registered: string; website: string; phone: string; email: string; risk: 'Medium' | 'High' | 'Low'; shareholders: Person[]; ubo: Person[]; representatives: Person[]; supportingDocuments: string[]; accounts: Account[]; apartado: Account[]; }
export interface ReviewCase { id: string; status: CaseStatus; edd: 0 | 1 | 2; profile: ClientProfile; form: ReviewForm; lastFollowUp?: string; resolution?: string; }
export function emptyForm(): ReviewForm { return { checks: [false, false], decision: '', next: '', documents: '', escalateTo: '', followUp: '' }; }
export function isEscalation(form: ReviewForm): boolean { return form.decision === 'escalate' || (form.decision === 'true-positive' && form.next === 'escalate'); }
export function validationError(item: ReviewCase): string {
  if (['Closed', 'Escalated', 'Waiting for documents', 'Waiting for clarification'].includes(item.status)) return 'This case is not awaiting an analyst action.';
  if (!item.form.checks.every(Boolean)) return 'Complete both checklist items before continuing.';
  if (item.status === 'Documents request') return '';
  if (item.status === 'Documents check') {
    if (!item.form.documents) return 'Select whether the client provided documents.';
    if (item.form.documents === 'missing') return item.form.decision ? 'Select how to proceed with the case.' : '';
  }
  const allowed: Decision[] = item.status === 'Initial review' ? ['true-positive', 'false-positive'] : ['not-suspicious', 'clarification', 'edd2', 'escalate'];
  if (!allowed.includes(item.form.decision) || (item.form.decision === 'true-positive' && !item.form.next)) return 'Select how to proceed with the case.';
  if (isEscalation(item.form) && !item.form.escalateTo) return 'Select who to escalate the case to.';
  return '';
}
export function advanceCase(item: ReviewCase): ReviewCase {
  if (validationError(item)) return item;
  const form = item.form;
  let status: CaseStatus = item.status;
  let edd = item.edd;
  let resolution = '';
  if (item.status === 'Documents request') status = 'Waiting for documents';
  else if (item.status === 'Documents check' && form.documents === 'missing') { status = 'Waiting for documents'; resolution = 'Reminder recorded — send it via CRM chat'; }
  else if (isEscalation(form)) { status = 'Escalated'; resolution = 'Escalated to ' + form.escalateTo; }
  else if (form.decision === 'false-positive' || form.decision === 'not-suspicious') { status = 'Closed'; resolution = form.decision === 'false-positive' ? 'False positive' : 'Client is no longer suspicious'; }
  else if (form.decision === 'true-positive' || form.decision === 'edd2') { status = 'Documents request'; edd = form.decision === 'edd2' ? 2 : 1; }
  else if (form.decision === 'clarification') status = 'Waiting for clarification';
  return { ...item, status, edd, lastFollowUp: form.followUp.trim(), resolution, form: emptyForm() };
}
const person = (name: string, description: string, shares?: string, match = false): Person => ({ name, description, shares, match });
const account = (prefix: string, name: string, status: Account['status'], amount: string, reason?: string, overdraft?: string): Account => ({ id: prefix, name, status, amount, opened: '20 Oct 2025', reason, overdraft });
export function createCases(): ReviewCase[] {
  const alejandro = person('Alejandro García Mendoza', 'Mexico, Male, 14 May 1978');
  const maria = person('María Fernanda López Ruiz', 'Mexico, Female, 22 Sep 1982');
  const profiles: ClientProfile[] = [
    { company: 'Monteverde Suministros', legalName: 'Comercializadora Monteverde, S.A. de C.V.', companyId: '78767654678927', rfc: 'MVE160318KX7', registration: '123456', city: 'Ciudad de México, Mexico', address: 'Av. Insurgentes Sur 1647, San José Insurgentes, CDMX, C.P. 03900', activity: 'Wholesale of office supplies and equipment', incorporated: '18 Mar 2016', employees: '48', registered: '10 Jul 2024', website: 'www.monteverde-suministros.example', phone: '+52 55 5550 1847', email: 'contacto@monteverde-suministros.example', risk: 'Medium', shareholders: [{ ...alejandro, shares: '45%, 4,500 shares' }, { ...maria, shares: '55%, 5,500 shares' }], ubo: [alejandro, { ...maria, match: true }, person('Carlos Alberto Herrera Sánchez','Mexico, Male, 08 Nov 1975'),person('Lucía Isabel Torres Vega','Mexico, Female, 03 Feb 1980')], representatives: [alejandro,person('Patricia Elena Ramírez Castro','Mexico, Female, 17 Jul 1986')], supportingDocuments: [], accounts: [account('mv-01','Cuenta Empresa','Active','$3,000,000',undefined,'$3,000'),account('mv-02','Cuenta Empresa 2','Active','$3,000,000'),account('mv-03','Cuenta Empresa 4','Pending closure','$3,000,000','AML suspected'),account('mv-04','Cuenta Empresa 4','Closed','$3,000,000','Compliance check failed'), ...[5,6,7,8].map(n=>account('mv-0'+n,'Cuenta Empresa '+n,'Closed','$3,000,000'))], apartado: [account('mv-09','Apartado','Active','$3,000,000')] },
    { company: 'Corazón del Sur', legalName: 'Alimentos Corazón del Sur, S.A. de C.V.', companyId: '60839217451620', rfc: 'ACS190612QF2', registration: '286519', city: 'Oaxaca de Juárez, Mexico', address: 'Av. Universidad 120, Centro, Oaxaca de Juárez, Oax., C.P. 68000', activity: 'Food production and wholesale distribution', incorporated: '12 Jun 2019', employees: '126', registered: '04 Feb 2025', website: 'www.corazon-del-sur.example', phone: '+52 951 555 0284', email: 'administracion@corazon-del-sur.example', risk: 'High', shareholders: [person('Sofía Hernández Cruz','Mexico, Female, 21 Aug 1985','60%, 6,000 shares'),person('Diego Morales Castillo','Mexico, Male, 09 Dec 1981','40%, 4,000 shares')], ubo: [person('Sofía Hernández Cruz','Mexico, Female, 21 Aug 1985',undefined,true),person('Diego Morales Castillo','Mexico, Male, 09 Dec 1981')], representatives: [person('Valeria Pérez Santos','Mexico, Female, 16 Apr 1988')], supportingDocuments: ['Bank statement — September 2026','Invoice — September 2026','Source of funds declaration'], accounts: [account('cs-01','Cuenta Operativa','Active','$845,200'),account('cs-02','Cuenta Proveedores','Active','$219,450'),account('cs-03','Cuenta Nómina','Closed','$0','Closed at client request')], apartado: [account('cs-04','Reserva fiscal','Active','$120,000')] },
  ];
  const statuses: CaseStatus[] = ['Initial review','Documents check'];
  return profiles.map((profile,index)=>({ id:'AML-2026-00'+(index+1), status:statuses[index], edd:index===0?0:1, profile, form:emptyForm() }));
}
