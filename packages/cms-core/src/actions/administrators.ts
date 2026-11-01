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
  locale: string;
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
    locale: a.locale || "en",
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
    locale: created.locale || "en",
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
    locale: updated.locale || "en",
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

/**
 * Get the current administrator's locale directly from the database profile.
 * Searches database by user ID or email, falls back to session, cookie, settings, or 'en'.
 */
export async function getCurrentAdminLocaleAction(): Promise<"en" | "sv"> {
  try {
    let cookieLocale: "en" | "sv" | null = null;
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const val = cookieStore.get("cms_admin_locale")?.value;
      if (val === "sv" || val === "en") {
        cookieLocale = val;
      }
    } catch {
      // cookies() may not be available outside HTTP context
    }

    const session = await getServerSession(authOptions);

    if (session?.user) {
      const userEmail = session.user.email ? session.user.email.toLowerCase().trim() : undefined;
      const userId = session.user.id;

      // 1. Try finding administrator in DB by id or email
      const admin = await prisma.administrator.findFirst({
        where: {
          OR: [
            ...(userId ? [{ id: userId }] : []),
            ...(userEmail ? [{ email: userEmail }] : []),
          ],
        },
        select: { id: true, locale: true },
      });

      if (admin?.locale === "sv" || admin?.locale === "en") {
        return admin.locale;
      }

      // If user had a locale in session
      if (session.user.locale === "sv" || session.user.locale === "en") {
        return session.user.locale as "en" | "sv";
      }
    }

    // 2. If cookie was explicitly set by user, honor it
    if (cookieLocale) {
      return cookieLocale;
    }

    // 3. Fallback to settings table
    const settingRow = await prisma.setting.findUnique({
      where: { setting_key: "admin_language" },
    });
    if (settingRow?.setting_value === "sv" || settingRow?.setting_value === "en") {
      return settingRow.setting_value as "en" | "sv";
    }

    return "en";
  } catch (err) {
    console.error("[cms-core] Failed to fetch current admin locale:", err);
    return "en";
  }
}

/**
 * Update the current administrator's locale directly on their database user profile.
 */
export async function updateCurrentAdminLocaleAction(
  newLocale: string
): Promise<{ success: boolean; locale: "en" | "sv" }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized: Authentication required.");
  }

  const validLocale: "en" | "sv" = newLocale === "sv" ? "sv" : "en";
  const userEmail = session.user.email ? session.user.email.toLowerCase().trim() : undefined;
  const userId = session.user.id;

  try {
    const existing = await prisma.administrator.findFirst({
      where: {
        OR: [
          ...(userId ? [{ id: userId }] : []),
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      },
    });

    if (existing) {
      await prisma.administrator.update({
        where: { id: existing.id },
        data: { locale: validLocale },
      });
    } else if (userEmail) {
      // Upsert administrator record if not found yet
      await prisma.administrator.upsert({
        where: { email: userEmail },
        update: { locale: validLocale },
        create: {
          email: userEmail,
          first_name: session.user.firstName || "Admin",
          last_name: session.user.lastName || "User",
          password_hash: "",
          role: session.user.role || AdminRole.ADMIN,
          locale: validLocale,
        },
      });
    }

    // Also sync to global settings table so both user profile and settings stay in lockstep
    await prisma.setting.upsert({
      where: { setting_key: "admin_language" },
      update: { setting_value: validLocale },
      create: { setting_key: "admin_language", setting_value: validLocale },
    });
  } catch (err) {
    console.warn("[cms-core] Could not update administrator locale in DB:", err);
  }

  // Also set cookie if in request context
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.set("cms_admin_locale", validLocale, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    });
  } catch {
    // cookies() may not be available or writable in some contexts
  }

  return { success: true, locale: validLocale };
}
