import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 3650;

/** Uploads an image to the shared photo bucket and returns a long-lived signed URL. */
export async function uploadPhoto(prefix: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("player-photos")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from("player-photos")
    .createSignedUrl(path, TEN_YEARS);
  if (signError) throw signError;
  return data.signedUrl;
}
