import { prisma } from "../db";

export interface LandlordDto {
  id: string;
  first_name: string;
  last_name: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  has_swish: boolean;
  account_type: string | null;
  account_number: string | null;
  created_at: string;
  updated_at: string;
}

export async function getLandlordsAction(): Promise<LandlordDto[]> {
  try {
    const raw = await prisma.landlord.findMany({
      orderBy: { created_at: "asc" },
    });

    return raw.map((l) => ({
      id: l.id,
      first_name: l.first_name,
      last_name: l.last_name,
      address: l.address,
      postal_code: l.postal_code,
      city: l.city,
      email: l.email,
      phone: l.phone,
      mobile: l.mobile,
      has_swish: l.has_swish,
      account_type: l.account_type,
      account_number: l.account_number,
      created_at: l.created_at.toISOString(),
      updated_at: l.updated_at.toISOString(),
    }));
  } catch (err) {
    console.error("[cms-core] Failed to fetch landlords:", err);
    return [];
  }
}

export async function createLandlordAction(data: {
  first_name: string;
  last_name: string;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  has_swish?: boolean;
  account_type?: string | null;
  account_number?: string | null;
}): Promise<LandlordDto> {
  const normalizedData = {
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    address: data.address?.trim() || null,
    postal_code: data.postal_code?.trim() || null,
    city: data.city?.trim() || null,
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    mobile: data.mobile?.trim() || null,
    has_swish: Boolean(data.has_swish),
    account_type: data.account_type?.trim() || null,
    account_number: data.account_number?.trim() || null,
  };

  const created = await prisma.landlord.create({
    data: normalizedData,
  });

  return {
    id: created.id,
    first_name: created.first_name,
    last_name: created.last_name,
    address: created.address,
    postal_code: created.postal_code,
    city: created.city,
    email: created.email,
    phone: created.phone,
    mobile: created.mobile,
    has_swish: created.has_swish,
    account_type: created.account_type,
    account_number: created.account_number,
    created_at: created.created_at.toISOString(),
    updated_at: created.updated_at.toISOString(),
  };
}

export async function updateLandlordAction(data: {
  id: string;
  first_name: string;
  last_name: string;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  has_swish?: boolean;
  account_type?: string | null;
  account_number?: string | null;
}): Promise<LandlordDto> {
  const normalizedData = {
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    address: data.address?.trim() || null,
    postal_code: data.postal_code?.trim() || null,
    city: data.city?.trim() || null,
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    mobile: data.mobile?.trim() || null,
    has_swish: Boolean(data.has_swish),
    account_type: data.account_type?.trim() || null,
    account_number: data.account_number?.trim() || null,
  };

  const updated = await prisma.landlord.update({
    where: { id: data.id },
    data: normalizedData,
  });

  return {
    id: updated.id,
    first_name: updated.first_name,
    last_name: updated.last_name,
    address: updated.address,
    postal_code: updated.postal_code,
    city: updated.city,
    email: updated.email,
    phone: updated.phone,
    mobile: updated.mobile,
    has_swish: updated.has_swish,
    account_type: updated.account_type,
    account_number: updated.account_number,
    created_at: updated.created_at.toISOString(),
    updated_at: updated.updated_at.toISOString(),
  };
}

export async function deleteLandlordAction(id: string): Promise<void> {
  await prisma.landlord.delete({
    where: { id },
  });
}
