import { getPrisma } from "../db.js";

// NFR-12: audit log storage.
export function createPrismaAuditRepository() {
  return {
    record({ actorId, action, entityType, entityId, details }) {
      return getPrisma().auditLog.create({
        data: { actorId, action, entityType, entityId, details: details ?? undefined },
      });
    },
    list({ limit, offset, action }) {
      return getPrisma().auditLog.findMany({
        where: action ? { action } : undefined,
        orderBy: { id: "desc" },
        take: limit,
        skip: offset,
      });
    },
  };
}

// FR-23: system settings storage.
export function createPrismaSettingsRepository() {
  return {
    listAll() {
      return getPrisma().systemSetting.findMany();
    },
    upsert(key, value, updatedById) {
      return getPrisma().systemSetting.upsert({
        where: { key },
        update: { value, updatedById },
        create: { key, value, updatedById },
      });
    },
  };
}

// FR-24: role permission overrides.
export function createPrismaPermissionRepository() {
  return {
    listOverrides() {
      return getPrisma().rolePermission.findMany();
    },
    setOverride(role, permission, granted) {
      return getPrisma().rolePermission.upsert({
        where: { role_permission: { role, permission } },
        update: { granted },
        create: { role, permission, granted },
      });
    },
  };
}
