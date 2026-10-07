import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Panel from '@/app/panel';
import ServiceUnavailable from './service-unavailable';
export default async function WorkspacePage({
  view,
}: {
  view: 'connections' | 'platform' | 'settings' | 'tenants';
}) {
  let user;
  try {
    user = await getUser();
  } catch {
    return <ServiceUnavailable />;
  }
  if (!user) redirect(`/login?redirect=/${view}`);
  return <Panel initialView={view} />;
}
