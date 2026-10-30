import { prisma } from "../db";
import { ensureLocalMediaFromUrl } from "./media";

export interface SaveTextFieldParams {
  pageId: number | string;
  nbr: number;
  content: string;
  locale?: string;
  translations?: Record<string, string>;
  classNames?: string | null;
  textType?: string | null;
  rows?: number | null;
}

export async function saveTextFieldAction({
  pageId,
  nbr,
  content,
  locale = "sv",
  translations,
  classNames,
  textType = "plain",
  rows,
}: SaveTextFieldParams) {
  const numericPageId = Number(pageId) || 1001;
  // Upsert the main PageField record
  const field = await prisma.pageField.upsert({
    where: {
      page_id_nbr_field_type: {
        page_id: numericPageId,
        nbr,
        field_type: "TEXT",
      },
    },
    update: {
      type: textType,
      rows,
      class_names: classNames,
      ...(locale === "sv" ? { content } : {}),
    },
    create: {
      page_id: numericPageId,
      nbr,
      field_type: "TEXT",
      type: textType,
      rows,
      class_names: classNames,
      content: locale === "sv" ? content : "",
    },
  });

  // If translations map is provided, upsert all secondary language translations
  if (translations && typeof translations === "object") {
    for (const [loc, transContent] of Object.entries(translations)) {
      if (loc && loc !== "sv") {
        await prisma.pageFieldTranslation.upsert({
          where: {
            page_field_id_locale: {
              page_field_id: field.id,
              locale: loc,
            },
          },
          update: {
            content: transContent ?? "",
          },
          create: {
            page_field_id: field.id,
            locale: loc,
            content: transContent ?? "",
          },
        });
      }
    }
  } else if (locale && locale !== "sv") {
    await prisma.pageFieldTranslation.upsert({
      where: {
        page_field_id_locale: {
          page_field_id: field.id,
          locale,
        },
      },
      update: {
        content,
      },
      create: {
        page_field_id: field.id,
        locale,
        content,
      },
    });
  }

  return prisma.pageField.findUnique({
    where: { id: field.id },
    include: { translations: true },
  });
}

export interface SaveImageFieldParams {
  pageId: number | string;
  nbr: number;
  imageUrl: string;
  width?: number | null;
  height?: number | null;
  maxWidth?: number | null;
  maxHeight?: number | null;
  ratio?: string | null;
  classNames?: string | null;
}

export interface DeleteImageFieldParams {
  pageId: number | string;
  nbr: number;
}

export async function deleteImageFieldAction({
  pageId,
  nbr,
}: DeleteImageFieldParams) {
  const numericPageId = Number(pageId) || 1001;
  // Delete the PageField record for this field on this page.
  // Crucially, this only removes the page field association and DOES NOT delete any records in FileAndImage (Media & Files).
  await prisma.pageField.deleteMany({
    where: {
      page_id: numericPageId,
      nbr,
      field_type: "IMAGE",
    },
  });

  return { success: true };
}

export async function saveImageFieldAction({
  pageId,
  nbr,
  imageUrl,
  width,
  height,
  maxWidth,
  maxHeight,
  ratio,
  classNames,
}: SaveImageFieldParams) {
  const numericPageId = Number(pageId) || 1001;

  if (!imageUrl || !imageUrl.trim()) {
    await deleteImageFieldAction({ pageId: numericPageId, nbr });
    return null;
  }

  // Ensure image is stored locally in FileAndImage (downloads external URLs into physical files)
  const fileRecord = await ensureLocalMediaFromUrl(imageUrl);

  const field = await prisma.pageField.upsert({
    where: {
      page_id_nbr_field_type: {
        page_id: numericPageId,
        nbr,
        field_type: "IMAGE",
      },
    },
    update: {
      image_id: fileRecord?.id ?? null,
      width,
      height,
      max_width: maxWidth,
      max_height: maxHeight,
      ratio,
      class_names: classNames,
    },
    create: {
      page_id: numericPageId,
      nbr,
      field_type: "IMAGE",
      image_id: fileRecord?.id ?? null,
      width,
      height,
      max_width: maxWidth,
      max_height: maxHeight,
      ratio,
      class_names: classNames,
    },
    include: {
      image: true,
    },
  });

  return field;
}

export interface SaveGalleryFieldItem {
  imageId?: string | null;
  imageUrl?: string;
  caption?: string | null;
  translations?: Record<string, string> | null;
  sortOrder?: number;
}

export interface SaveGalleryFieldParams {
  pageId: number | string;
  nbr: number;
  items: SaveGalleryFieldItem[];
}

export async function saveGalleryFieldAction({
  pageId,
  nbr,
  items,
}: SaveGalleryFieldParams) {
  const numericPageId = Number(pageId) || 1001;
  const numericNbr = Number(nbr) || 1;

  const resolvedItems: Array<{
    image_id: string;
    sort_order: number;
    caption: string | null;
    translations: Record<string, string> | undefined;
  }> = [];

  for (let i = 0; i < (items || []).length; i++) {
    const item = items[i];
    let imageId = item.imageId || null;

    if (!imageId && item.imageUrl) {
      const fileRecord = await ensureLocalMediaFromUrl(item.imageUrl);
      if (fileRecord) {
        imageId = fileRecord.id;
      }
    } else if (imageId) {
      // Verify the image exists in FileAndImage
      const exists = await prisma.fileAndImage.findUnique({
        where: { id: imageId },
        select: { id: true },
      });
      if (!exists && item.imageUrl) {
        const fileRecord = await ensureLocalMediaFromUrl(item.imageUrl);
        if (fileRecord) {
          imageId = fileRecord.id;
        }
      }
    }

    if (imageId) {
      resolvedItems.push({
        image_id: imageId,
        sort_order: typeof item.sortOrder === "number" ? item.sortOrder : i,
        caption: item.caption?.trim() || null,
        translations:
          item.translations && typeof item.translations === "object"
            ? item.translations
            : undefined,
      });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.gallery.deleteMany({
      where: {
        page_id: numericPageId,
        nbr: numericNbr,
      },
    });

    for (let i = 0; i < resolvedItems.length; i++) {
      const row = resolvedItems[i];
      await tx.gallery.create({
        data: {
          page_id: numericPageId,
          nbr: numericNbr,
          image_id: row.image_id,
          sort_order: i,
          caption: row.caption,
          translations: row.translations ?? undefined,
        },
      });
    }
  });

  return prisma.gallery.findMany({
    where: {
      page_id: numericPageId,
      nbr: numericNbr,
    },
    orderBy: { sort_order: "asc" },
    include: {
      image: true,
    },
  });
}
