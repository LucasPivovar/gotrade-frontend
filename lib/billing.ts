import type { BillingRecord } from './model';
export function validateBilling(
  value: unknown,
): asserts value is BillingRecord {
  if (!value || typeof value !== 'object') throw Error('Registro inválido.');
  const v = value as BillingRecord;
  if (
    typeof v.id !== 'string' ||
    !/^[a-f\d-]{36}$/i.test(v.id) ||
    typeof v.tenantId !== 'string'
  )
    throw Error('Identificação inválida.');
  if (typeof v.plan !== 'string' || !v.plan.trim() || v.plan.length > 80)
    throw Error('Informe o plano.');
  if (
    !Number.isSafeInteger(v.amountCents) ||
    v.amountCents <= 0 ||
    v.amountCents > 100000000
  )
    throw Error('Valor inválido.');
  if (
    typeof v.due !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(v.due) ||
    !Number.isFinite(Date.parse(v.due)) ||
    new Date(v.due).toISOString().slice(0, 10) !== v.due
  )
    throw Error('Vencimento inválido.');
  if (!['pending', 'paid', 'canceled'].includes(v.status))
    throw Error('Situação inválida.');
}
export function billingStatus(record: BillingRecord, today: string) {
  return record.status === 'pending' && record.due < today
    ? 'overdue'
    : record.status;
}
