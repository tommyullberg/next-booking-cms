import { NextRequest, NextResponse } from "next/server";
import { saveTextFieldAction, saveImageFieldAction } from "../actions/fields";
import { uploadMediaAction } from "../actions/media";
import { translateText } from "../ai";

export async function handleSaveTextField(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await saveTextFieldAction(body);
    return NextResponse.json({ success: true, field: result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to save text field" },
      { status: 500 }
    );
  }
}

export async function handleSaveImageField(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await saveImageFieldAction(body);
    return NextResponse.json({ success: true, field: result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to save image field" },
      { status: 500 }
    );
  }
}

export async function handleUploadMedia(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await uploadMediaAction(buffer, file.name, file.type);

    return NextResponse.json({
      success: true,
      fileUrl: result.file_url,
      fileName: result.file_name,
      id: result.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function handleTranslate(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await translateText(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Translation failed" },
      { status: 500 }
    );
  }
}
