import { getUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Panel from '@/app/panel';
import ServiceUnavailable from './service-unavailable';
import { workspace, scoped } from '@/lib/server';
import { demoEnabled } from '@/lib/demo';
export default async function WorkspacePage({
  view,
}: {
  view: 'connections' | 'platform' | 'settings' | 'tenants' | 'support';
}) {
  let user;
  try {
    user = await getUser();
  } catch {
    return <ServiceUnavailable />;
  }
  if (!user) redirect(`/login?redirect=/${view}`);
  try {
    const w = await workspace();
    return (
      <Panel
        initialView={view}
        demoSample={demoEnabled()}
        initialSession={{
          state: scoped(w),
          role: w.role,
          tenantId: w.tenantId,
          email: w.user.email,
          revision: w.row.revision,
        }}
      />
    );
  } catch {
    return <ServiceUnavailable />;
  }
}
