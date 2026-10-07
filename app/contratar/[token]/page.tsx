import { database } from '@/lib/server';
import { notFound } from 'next/navigation';
import EnrollmentCheckout from '@/components/enrollment-checkout';
import type { State } from '@/lib/model';
import ServiceUnavailable from '@/components/service-unavailable';
import { demoEnabled } from '@/lib/demo';
export const dynamic = 'force-dynamic';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ valor?: string }>;
}) {
  const { token } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(token)) notFound();
  // Demo links survive ephemeral serverless storage. Real pricing always comes from the database.
  const amount = Number((await searchParams).valor);
  if (
    demoEnabled() &&
    Number.isSafeInteger(amount) &&
    amount > 0 &&
    amount <= 100000000
  )
    return <EnrollmentCheckout amountCents={amount} />;
  let row: { data: string } | null;
  try {
    row = await database()
      .prepare(
        "SELECT data FROM workspaces WHERE EXISTS (SELECT 1 FROM json_each(json_extract(data,'$.purchaseLinks')) WHERE json_extract(value,'$.id')=?) LIMIT 1",
      )
      .bind(token)
      .first<{ data: string }>();
  } catch {
    return <ServiceUnavailable />;
  }
  const link =
    row &&
    (JSON.parse(row.data) as State).purchaseLinks?.find((l) => l.id === token);
  if (!link) notFound();
  return <EnrollmentCheckout amountCents={link.amountCents} />;
}
