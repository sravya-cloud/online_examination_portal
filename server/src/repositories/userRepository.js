import { getPrisma } from "../db.js";

// The auth code only depends on this small interface, so it can be tested
// without a database: findByEmail(email) and findById(id) -> user | null.
// FR-03 adds list(), create() and update() for administrators.
export function createPrismaUserRepository() {
  return {
    findByEmail(email) {
      return getPrisma().user.findUnique({ where: { email } });
    },
    findById(id) {
      return getPrisma().user.findUnique({ where: { id } });
    },
    list({ role, limit, offset }) {
      return getPrisma().user.findMany({
        where: role ? { role } : undefined,
        orderBy: { id: "asc" },
        take: limit,
        skip: offset,
      });
    },
    create(data) {
      return getPrisma().user.create({ data });
    },
    update(id, data) {
      return getPrisma().user.update({ where: { id }, data });
    },
  };
}
