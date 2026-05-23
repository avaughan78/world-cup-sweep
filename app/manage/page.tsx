import { getCompanyByCode } from '@/lib/db';
import CompanyGate from '@/components/CompanyGate';
import ManageClient from '@/components/ManageClient';

export const dynamic = 'force-dynamic';

export default async function ManagePage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  const code = params.code?.trim().toUpperCase();

  if (!code) return <CompanyGate redirectPath="/manage" />;

  const company = await getCompanyByCode(code);
  if (!company) return <CompanyGate invalidCode redirectPath="/manage" />;

  return <ManageClient company={company} />;
}
