import { getServerSession } from "next-auth";
import { authOptions } from "../auth/auth-options";
import { prisma } from "../db";
import { hashPassword } from "../auth/password";
import { AdminRole } from "@prisma/client";

export interface AdministratorDto {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string | null;
  role: AdminRole;
  created_at: string;
  updated_at: string;
}

/**
 * Validates whether the authenticated user has permission to manage administrator accounts.
 */
async function getValidatedSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized: Authentication required.");
  }

  const role = session.user.role as AdminRole;
  if (role === "EDITOR") {
    throw new Error(
      "Forbidden: Editors are not permitted to manage administrator accounts."
    );
  }

  return { session, user: session.user, role };
}

/**
 * Retrieve all administrators, ensuring the default SuperAdmin is always first.
 */
export async function getAdministratorsAction(): Promise<AdministratorDto[]> {
  const admins = await prisma.administrator.findMany({
    orderBy: { created_at: "asc" },
  });

  const mapped: AdministratorDto[] = admins.map((a) => ({
    id: a.id,
    first_name: a.first_name,
    last_name: a.last_name,
    email: a.email,
    mobile: a.mobile,
    role: a.role,
    created_at: a.created_at.toISOString(),
    updated_at: a.updated_at.toISOString(),
  }));

  mapped.sort((a, b) => {
    const aSuper = a.role === AdminRole.SUPERADMIN ? 0 : 1;
    const bSuper = b.role === AdminRole.SUPERADMIN ? 0 : 1;
    if (aSuper !== bSuper) return aSuper - bSuper;
    return a.created_at.localeCompare(b.created_at);
  });

  return mapped;
}

/**
 * Create a new administrator account (role defaults to ADMIN / Administrator).
 */
export async function createAdministratorAction(data: {
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  password: string;
  role?: AdminRole;
}): Promise<AdministratorDto> {
  await getValidatedSession();

  const normalizedEmail = data.email.toLowerCase().trim();
  const existing = await prisma.administrator.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new Error(
      "Conflict: An administrator with this email already exists."
    );
  }

  const password_hash = await hashPassword(data.password);

  const created = await prisma.administrator.create({
    data: {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email: normalizedEmail,
      mobile: data.mobile?.trim() || null,
      password_hash,
      role: AdminRole.ADMIN,
    },
  });

  return {
    id: created.id,
    first_name: created.first_name,
    last_name: created.last_name,
    email: created.email,
    mobile: created.mobile,
    role: created.role,
    created_at: created.created_at.toISOString(),
    updated_at: created.updated_at.toISOString(),
  };
}

/**
 * Update administrator details (SuperAdmin account is locked).
 */
export async function updateAdministratorAction(data: {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  password?: string;
}): Promise<AdministratorDto> {
  await getValidatedSession();

  const target = await prisma.administrator.findUnique({
    where: { id: data.id },
  });

  if (!target) {
    throw new Error("Not Found: Administrator does not exist.");
  }

  if (target.role === AdminRole.SUPERADMIN) {
    throw new Error("Forbidden: The default Super Admin account is locked.");
  }

  const password_hash =
    data.password && data.password.trim().length > 0
      ? await hashPassword(data.password.trim())
      : undefined;

  const updated = await prisma.administrator.update({
    where: { id: data.id },
    data: {
      first_name: data.first_name ? data.first_name.trim() : undefined,
      last_name: data.last_name ? data.last_name.trim() : undefined,
      email: data.email ? data.email.toLowerCase().trim() : undefined,
      mobile:
        data.mobile !== undefined ? data.mobile?.trim() || null : undefined,
      ...(password_hash ? { password_hash } : {}),
    },
  });

  return {
    id: updated.id,
    first_name: updated.first_name,
    last_name: updated.last_name,
    email: updated.email,
    mobile: updated.mobile,
    role: updated.role,
    created_at: updated.created_at.toISOString(),
    updated_at: updated.updated_at.toISOString(),
  };
}

/**
 * Update administrator password.
 */
export async function updateAdministratorPasswordAction(data: {
  id: string;
  newPassword: string;
}): Promise<{ success: boolean }> {
  await getValidatedSession();

  const target = await prisma.administrator.findUnique({
    where: { id: data.id },
  });

  if (!target) {
    throw new Error("Not Found: Administrator does not exist.");
  }

  if (target.role === AdminRole.SUPERADMIN) {
    throw new Error("Forbidden: The default Super Admin account is locked.");
  }

  const password_hash = await hashPassword(data.newPassword);

  await prisma.administrator.update({
    where: { id: data.id },
    data: { password_hash },
  });

  return { success: true };
}

/**
 * Delete administrator (SuperAdmin account is locked and cannot be deleted).
 */
export async function deleteAdministratorAction(
  id: string
): Promise<{ success: boolean }> {
  await getValidatedSession();

  const target = await prisma.administrator.findUnique({
    where: { id },
  });

  if (!target) {
    throw new Error("Not Found: Administrator does not exist.");
  }

  if (target.role === AdminRole.SUPERADMIN) {
    throw new Error(
      "Forbidden: The default Super Admin account is locked and cannot be deleted."
    );
  }

  await prisma.administrator.delete({
    where: { id },
  });

  return { success: true };
}
