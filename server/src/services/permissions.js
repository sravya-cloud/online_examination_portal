// FR-24: role permissions that an administrator can change.
// Permissions not listed here (managing users, settings, permissions and the
// audit log) always belong to administrators, so an admin can never lock
// themselves out.
export const ROLES = ["STUDENT", "TEACHER", "ADMIN"];

export const PERMISSION_CATALOG = {
  "question.manage": "Create, edit and delete questions and question pools",
  "report.view": "View examination reports",
};

const DEFAULT_GRANTS = {
  "question.manage": ["TEACHER"],
  "report.view": ["TEACHER", "ADMIN"],
};

function defaultFor(role, permission) {
  return (DEFAULT_GRANTS[permission] || []).includes(role);
}

// permissionRepo (optional): listOverrides() -> [{ role, permission, granted }]
//                            setOverride(role, permission, granted)
// Without a repository the defaults above apply.
export function createPermissionService({ permissionRepo } = {}) {
  async function overrides() {
    if (!permissionRepo) return [];
    return (await permissionRepo.listOverrides()) || [];
  }

  return {
    async has(role, permission) {
      if (!ROLES.includes(role) || !(permission in PERMISSION_CATALOG)) return false;
      const override = (await overrides()).find(
        (o) => o.role === role && o.permission === permission
      );
      return override ? Boolean(override.granted) : defaultFor(role, permission);
    },

    async matrix() {
      const list = await overrides();
      const result = {};
      for (const role of ROLES) {
        result[role] = {};
        for (const permission of Object.keys(PERMISSION_CATALOG)) {
          const override = list.find((o) => o.role === role && o.permission === permission);
          result[role][permission] = override
            ? Boolean(override.granted)
            : defaultFor(role, permission);
        }
      }
      return result;
    },

    async set(role, permission, granted) {
      if (!permissionRepo) throw new Error("Permissions cannot be changed without a repository");
      await permissionRepo.setOverride(role, permission, granted);
    },
  };
}
