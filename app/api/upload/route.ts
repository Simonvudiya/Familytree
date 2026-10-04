import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const familyId = formData.get("family_id") as string;
    const type = formData.get("type") as "image" | "document" | "audio" | "video";

    if (!file || !familyId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!membership || !["owner", "admin", "editor", "contributor"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate file type
    const validTypes = {
      image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"],
      document: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"],
      audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"],
      video: ["video/mp4", "video/webm", "video/quicktime"],
    };

    if (!validTypes[type].includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Upload to storage
    const fileName = `${crypto.randomUUID()}.${file.name.split(".").pop()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("family-media")
      .upload(`${familyId}/${type}s/${fileName}`, file);

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("family-media").getPublicUrl(uploadData.path);

    // Generate thumbnail for images
    let thumbnailUrl = null;
    if (type === "image") {
      // In production, use Supabase image transformations or a separate thumbnail generation service
      thumbnailUrl = `${urlData.publicUrl}?width=300&height=300&resize=cover`;
    }

    // Save metadata to database
    const { data: media, error } = await supabase
      .from("media")
      .insert({
        family_id: familyId,
        uploaded_by: user.id,
        type,
        url: urlData.publicUrl,
        thumbnail: thumbnailUrl,
        filename: file.name,
        size: file.size,
        mime_type: file.type,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activity
    await supabase.from("activity_log").insert({
      family_id: familyId,
      user_id: user.id,
      action: "upload",
      entity_type: "media",
      entity_id: media.id,
      description: `Uploaded ${type}: ${file.name}`,
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}