import { logger } from '@/server/support/logger';

/**
 * A structured record on the `security` channel of the log (L2-076.2): the event type and what it
 * concerns. Routing security events to people is M10's (M3 D16).
 */
export function recordSecurityEvent(event: string, context: Record<string, unknown>): void {
  logger().warn({ channel: 'security', event, ...context }, event);
}
