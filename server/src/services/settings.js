// FR-23: only these settings can be viewed or changed by an administrator.
export const APPROVED_SETTINGS = {
  institutionName: {
    type: "string",
    max: 100,
    default: "Online Examination Portal",
    label: "Institution name shown to users",
  },
  supportEmail: {
    type: "email",
    default: "",
    label: "Support contact email",
  },
  defaultExamDurationMinutes: {
    type: "integer",
    min: 5,
    max: 300,
    default: 60,
    label: "Default exam duration in minutes",
  },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns { value } for a valid value or { error } with a message.
export function validateSetting(key, raw) {
  const spec = APPROVED_SETTINGS[key];
  if (!spec) return { error: "Not an approved setting." };

  if (spec.type === "integer") {
    if (!Number.isInteger(raw) || raw < spec.min || raw > spec.max) {
      return { error: `Must be a whole number from ${spec.min} to ${spec.max}.` };
    }
    return { value: raw };
  }
  if (typeof raw !== "string") return { error: "Must be text." };
  const value = raw.trim();
  if (spec.type === "email") {
    if (value && !EMAIL.test(value)) return { error: "Must be a valid email address." };
    return { value };
  }
  if (!value || value.length > spec.max) {
    return { error: `Must be 1 to ${spec.max} characters.` };
  }
  return { value };
}

function fromStored(spec, stored) {
  return spec.type === "integer" ? Number(stored) : stored;
}

// settingsRepo: listAll() -> [{ key, value }]; upsert(key, value, updatedById)
export function createSettingsService({ settingsRepo }) {
  return {
    async getAll() {
      const stored = settingsRepo ? (await settingsRepo.listAll()) || [] : [];
      const result = {};
      for (const [key, spec] of Object.entries(APPROVED_SETTINGS)) {
        const row = stored.find((s) => s.key === key);
        result[key] = row ? fromStored(spec, row.value) : spec.default;
      }
      return result;
    },

    async update(changes, updatedById) {
      for (const [key, value] of Object.entries(changes)) {
        await settingsRepo.upsert(key, String(value), updatedById);
      }
    },
  };
}
