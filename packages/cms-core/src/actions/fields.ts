import { prisma } from "../db";

export interface SaveTextFieldParams {
  pageId: string;
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
  // Upsert the main PageField record
  const field = await prisma.pageField.upsert({
    where: {
      page_id_nbr_field_type: {
        page_id: pageId,
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
      page_id: pageId,
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
  pageId: string;
  nbr: number;
  imageUrl: string;
  width?: number | null;
  height?: number | null;
  maxWidth?: number | null;
  maxHeight?: number | null;
  ratio?: string | null;
  classNames?: string | null;
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
  // Find or create FileAndImage entry
  let fileRecord = await prisma.fileAndImage.findFirst({
    where: { file_url: imageUrl },
  });

  if (!fileRecord && imageUrl) {
    const fileName = imageUrl.split("/").pop() || "uploaded-image";
    fileRecord = await prisma.fileAndImage.create({
      data: {
        file_name: fileName,
        file_url: imageUrl,
      },
    });
  }

  const field = await prisma.pageField.upsert({
    where: {
      page_id_nbr_field_type: {
        page_id: pageId,
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
      page_id: pageId,
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
