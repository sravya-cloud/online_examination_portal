// NFR-12: record important actions. Logging never blocks the action itself.
// auditRepo (optional): record(entry), list({ limit, offset, action })
export function createAuditLogger({ auditRepo } = {}) {
  return {
    async log(req, action, entityType, entityId, details) {
      if (!auditRepo) return;
      try {
        await auditRepo.record({
          actorId: req?.auth?.userId ?? null,
          action,
          entityType,
          entityId: entityId === undefined || entityId === null ? null : String(entityId),
          details: details ?? null,
        });
      } catch (err) {
        console.error("Audit log write failed:", err);
      }
    },

    async list(filters) {
      if (!auditRepo) return [];
      return auditRepo.list(filters);
    },
  };
}
