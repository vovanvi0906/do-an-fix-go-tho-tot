import fs from 'node:fs';
import crypto from 'node:crypto';
import { ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
export const AI01_ROLES = ['coordinator', 'reviewer_a', 'reviewer_b', 'adjudicator', 'viewer'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function readPolicy(filename) {
  try {
    const text = fs.readFileSync(filename, 'utf8'), value = JSON.parse(text);
    if (value.version !== 1 || !Array.isArray(value.users)) throw Error('schema');
    const users = new Map(), slots = new Set();
    // Legacy bootstrap metadata is retained for history, never used to grant management.
    for (const row of value.users) {
      if (!UUID.test(row.userId || '') || !AI01_ROLES.includes(row.role) || typeof row.expert !== 'boolean' || users.has(row.userId.toLowerCase())) throw Error('identity');
      if (['reviewer_a', 'reviewer_b'].includes(row.role)) {
        if (slots.has(row.role)) throw Error('slot');
        slots.add(row.role);
      }
      users.set(row.userId.toLowerCase(), { role: row.role, expert: row.expert });
    }
    return { users, document: value, revision: crypto.createHash('sha256').update(text).digest('hex') };
  } catch { throw new ServiceUnavailableException('AI01_POLICY_INVALID: Cấu hình quyền AI chưa hợp lệ; không tự cấp quyền.'); }
}
// req.user is produced by JwtStrategy after an ACTIVE account lookup in PostgreSQL.
export function principalFor(user, policy) {
  const id = String(user?.userId || user?.id || '').toLowerCase();
  if (!UUID.test(id)) throw new ForbiddenException('Cần tài khoản FixGo active đã xác thực.');
  const assignment = policy.users.get(id);
  if (user.role === 'ADMIN') {
    // A promotion must never expose other labels to someone already bound as a reviewer.
    if (['reviewer_a', 'reviewer_b'].includes(assignment?.role)) throw new ServiceUnavailableException('AI01_REVIEWER_CONFLICT: Admin đang gắn slot reviewer; cần đối chiếu lịch sử trước khi quản trị.');
    return { id, role: 'coordinator', expert: assignment?.role === 'coordinator' && assignment.expert === true, policyRevision: policy.revision };
  }
  if (!assignment) throw new ForbiddenException('AI01_ROLE_REQUIRED: Tài khoản chưa được phân công AI.');
  return { id, ...assignment, policyRevision: policy.revision };
}
export const OP_ROLES = {
  overview: AI01_ROLES, items: AI01_ROLES, catalog: AI01_ROLES, image: AI01_ROLES,
  mappings: ['coordinator'], mapping: ['coordinator'], annotate: ['reviewer_a', 'reviewer_b'],
  adjudication: ['coordinator', 'adjudicator'], adjudicate: ['coordinator', 'adjudicator'],
  provenance: ['coordinator'], save_provenance: ['coordinator'],
  related: ['coordinator', 'adjudicator'], related_image: ['coordinator', 'adjudicator'],
  readiness: ['coordinator', 'adjudicator'], history: ['coordinator'], export: ['coordinator'], download: ['coordinator'],
};
export function requireOperation(principal, operation) {
  if (!OP_ROLES[operation]?.includes(principal.role)) throw new ForbiddenException('Không có quyền thực hiện bước duyệt AI này.');
}

// SOLO has no reviewer assignments or bootstrap dependency. JWT strategy has already
// checked ACTIVE status and the current database role; expertise is not auto-granted.
export function soloPrincipalFor(user) {
  const id = String(user?.userId || user?.id || '').toLowerCase();
  if (user?.role !== 'ADMIN' || !UUID.test(id)) throw new ForbiddenException('Cần tài khoản ACTIVE / ADMIN đã xác thực.');
  return { id, role: 'coordinator', admin: true, expert: false, policyRevision: 'SOLO_THESIS_ACTIVE_ADMIN_V1' };
}
