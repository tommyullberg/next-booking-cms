import { handleCmsApiRoute } from "@next-booking/cms-core/server";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleCmsApiRoute(req, params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleCmsApiRoute(req, params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleCmsApiRoute(req, params);
}
