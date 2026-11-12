import { getPrisma } from "../db.js";

// The auth code only depends on this small interface, so it can be tested
// without a database: findByEmail(email) and findById(id) -> user | null.
export function createPrismaUserRepository() {
  return {
    findByEmail(email) {
      return getPrisma().user.findUnique({ where: { email } });
    },
    findById(id) {
      return getPrisma().user.findUnique({ where: { id } });
    },
  };
}
