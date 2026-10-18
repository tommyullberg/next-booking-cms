"use server";

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
    throw new Error("Forbidden: Editors are not permitted to manage administrator accounts.");
  }

  return { session, user: session.user, role };
}

/**
 * Retrieve all administrators.
 */
export async function getAdministratorsAction(): Promise<AdministratorDto[]> {
  await getValidatedSession();

  const admins = await prisma.administrator.findMany({
    orderBy: { created_at: "asc" },
  });

  return admins.map((a) => ({
    id: a.id,
    first_name: a.first_name,
    last_name: a.last_name,
    email: a.email,
    mobile: a.mobile,
    role: a.role,
    created_at: a.created_at.toISOString(),
    updated_at: a.updated_at.toISOString(),
  }));
}

/**
 * Create a new administrator account with RBAC validation.
 */
export async function createAdministratorAction(data: {
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  password: string;
  role: AdminRole;
}): Promise<AdministratorDto> {
  const { role: callerRole } = await getValidatedSession();

  // A regular administrator cannot create a SuperAdmin account
  if (data.role === AdminRole.SUPERADMIN && callerRole !== AdminRole.SUPERADMIN) {
    throw new Error("Forbidden: Only a SuperAdmin can create new SuperAdmin accounts.");
  }

  const existing = await prisma.administrator.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    throw new Error("Conflict: An administrator with this email already exists.");
  }

  const password_hash = await hashPassword(data.password);

  const created = await prisma.administrator.create({
    data: {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email: data.email.toLowerCase().trim(),
      mobile: data.mobile?.trim() || null,
      password_hash,
      role: data.role,
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
 * Update administrator details with strict SuperAdmin immutability for regular admins.
 */
export async function updateAdministratorAction(data: {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  role?: AdminRole;
}): Promise<AdministratorDto> {
  const { role: callerRole, user: callerUser } = await getValidatedSession();

  const target = await prisma.administrator.findUnique({
    where: { id: data.id },
  });

  if (!target) {
    throw new Error("Not Found: Administrator does not exist.");
  }

  // SuperAdmin Protection Rule: A regular administrator cannot edit a SuperAdmin
  if (target.role === AdminRole.SUPERADMIN && callerRole !== AdminRole.SUPERADMIN) {
    throw new Error("Forbidden: Regular administrators cannot edit or modify a SuperAdmin account.");
  }

  // Role Promotion Rule: A regular administrator cannot promote any user to SuperAdmin
  if (data.role === AdminRole.SUPERADMIN && callerRole !== AdminRole.SUPERADMIN) {
    throw new Error("Forbidden: Only a SuperAdmin can assign the SuperAdmin role.");
  }

  // Prevent demoting the last SuperAdmin
  if (
    target.role === AdminRole.SUPERADMIN &&
    data.role &&
    data.role !== AdminRole.SUPERADMIN
  ) {
    const superAdminCount = await prisma.administrator.count({
      where: { role: AdminRole.SUPERADMIN },
    });
    if (superAdminCount <= 1) {
      throw new Error("Forbidden: Cannot demote the last remaining SuperAdmin.");
    }
  }

  const updated = await prisma.administrator.update({
    where: { id: data.id },
    data: {
      first_name: data.first_name ? data.first_name.trim() : undefined,
      last_name: data.last_name ? data.last_name.trim() : undefined,
      email: data.email ? data.email.toLowerCase().trim() : undefined,
      mobile: data.mobile !== undefined ? data.mobile?.trim() || null : undefined,
      role: data.role || undefined,
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
 * Update administrator password with strict SuperAdmin protection.
 */
export async function updateAdministratorPasswordAction(data: {
  id: string;
  newPassword: string;
}): Promise<{ success: boolean }> {
  const { role: callerRole, user: callerUser } = await getValidatedSession();

  const target = await prisma.administrator.findUnique({
    where: { id: data.id },
  });

  if (!target) {
    throw new Error("Not Found: Administrator does not exist.");
  }

  // SuperAdmin Protection Rule: Regular administrator cannot change a SuperAdmin's password
  if (
    target.role === AdminRole.SUPERADMIN &&
    callerRole !== AdminRole.SUPERADMIN &&
    callerUser.id !== target.id
  ) {
    throw new Error("Forbidden: Regular administrators cannot change the password of a SuperAdmin.");
  }

  const password_hash = await hashPassword(data.newPassword);

  await prisma.administrator.update({
    where: { id: data.id },
    data: { password_hash },
  });

  return { success: true };
}

/**
 * Delete administrator with strict SuperAdmin protection.
 */
export async function deleteAdministratorAction(id: string): Promise<{ success: boolean }> {
  const { role: callerRole, user: callerUser } = await getValidatedSession();

  const target = await prisma.administrator.findUnique({
    where: { id },
  });

  if (!target) {
    throw new Error("Not Found: Administrator does not exist.");
  }

  // SuperAdmin Protection Rule 1: A regular administrator cannot delete a SuperAdmin
  if (target.role === AdminRole.SUPERADMIN && callerRole !== AdminRole.SUPERADMIN) {
    throw new Error("Forbidden: Regular administrators cannot delete a SuperAdmin account.");
  }

  // SuperAdmin Protection Rule 2: Cannot delete self
  if (callerUser.id === target.id) {
    throw new Error("Forbidden: You cannot delete your own active administrator account.");
  }

  // SuperAdmin Protection Rule 3: Cannot delete the last SuperAdmin
  if (target.role === AdminRole.SUPERADMIN) {
    const superAdminCount = await prisma.administrator.count({
      where: { role: AdminRole.SUPERADMIN },
    });
    if (superAdminCount <= 1) {
      throw new Error("Forbidden: Cannot delete the last remaining SuperAdmin.");
    }
  }

  await prisma.administrator.delete({
    where: { id },
  });

  return { success: true };
}
