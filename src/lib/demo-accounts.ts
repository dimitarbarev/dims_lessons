export const DEMO_ACCOUNTS = [
  { role: "teacher", name: "Dimitar", email: "dimi@lessons.app", password: "teacher" },
  { role: "parent", name: "Maria Petrova", email: "maria@lessons.app", password: "parent" },
  { role: "student", name: "Boris", email: "boris@lessons.app", password: "student" },
] as const;

export type DemoRole = (typeof DEMO_ACCOUNTS)[number]["role"];

export function demoAccount(role: DemoRole) {
  const account = DEMO_ACCOUNTS.find((item) => item.role === role);
  if (!account) throw new Error("Missing demo account");
  return account;
}
