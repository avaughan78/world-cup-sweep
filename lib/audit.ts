import sql from './db';

export type AuditEvent =
  | 'admin_login_ok'
  | 'admin_login_fail'
  | 'company_login_ok'
  | 'company_login_fail'
  | 'sweep_created'
  | 'company_created'
  | 'company_updated'
  | 'company_deleted'
  | 'participant_claimed'
  | 'tokens_generated'
  | 'company_reset'
  | 'tournament_reset'
  | 'page_view';

export async function writeAudit(
  event: AuditEvent,
  opts: { actor?: string; companyId?: number; details?: Record<string, unknown>; ip?: string } = {}
): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_log (event, actor, company_id, details, ip)
      VALUES (
        ${event},
        ${opts.actor ?? null},
        ${opts.companyId ?? null},
        ${opts.details ? JSON.stringify(opts.details) : null},
        ${opts.ip ?? null}
      )
    `;
  } catch {
    // Never let audit writes break the main request
  }
}
