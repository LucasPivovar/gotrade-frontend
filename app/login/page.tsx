import ServiceUnavailable from '@/components/service-unavailable';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import LoginForm from '@/components/login-form';
import { demoEnabled } from '@/lib/demo';
export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const params = await searchParams;
  let user;
  try {
    user = await getUser();
  } catch {
    return <ServiceUnavailable />;
  }
  if (!demoEnabled() && !params.invite && user) redirect('/');
  return <LoginForm invite={params.invite} demo={demoEnabled()} />;
}
