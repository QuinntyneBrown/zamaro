import { config } from '@config/zamaro';
import type { Session } from '@/server/http/session';
import { now } from '@/server/support/clock';

/**
 * The two marks an administrator's session carries (administration/secure-admin-access): when its
 * code step was passed, and when it last made a request. Both live in the session, so they go when
 * the session does, and both are read by the admin routes' gate in the pipeline.
 */
export function markMfaVerified(session: Session): void {
  session.data.mfaVerifiedAt = now().toSeconds();
  touchAdminActivity(session);
}

/** The code step was passed on this session (L2-066.2). */
export function isMfaVerified(session: Session): boolean {
  return typeof session.data.mfaVerifiedAt === 'number';
}

/** The session made a request, now. */
export function touchAdminActivity(session: Session): void {
  session.data.adminLastActivityAt = now().toSeconds();
}

/** More than the idle limit has passed since the last request; a session never stamped has not. */
export function adminIdledOut(session: Session): boolean {
  const last = session.data.adminLastActivityAt;
  return (
    typeof last === 'number' && now().toSeconds() - last > config().admin.idleTimeoutMinutes * 60
  );
}
