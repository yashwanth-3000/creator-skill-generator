import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type SkillRow = {
  id: string;
  skill_name: string;
  display_name: string | null;
  description: string | null;
  source_mode: string;
  has_zip: boolean;
  file_count: number;
  created_at: string;
  source_metadata: Record<string, unknown>;
};

export type SkillFileRow = {
  id: string;
  skill_id: string;
  relative_path: string;
  content: string;
  size_bytes: number;
  created_at: string;
};

export type SkillWithFiles = SkillRow & {
  skill_files: SkillFileRow[];
};

export async function fetchSkillsFromSupabase(): Promise<SkillRow[]> {
  const { data, error } = await supabase
    .from("skills")
    .select("id, skill_name, display_name, description, source_mode, has_zip, file_count, created_at, source_metadata")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchSkillDetailFromSupabase(
  skillName: string,
): Promise<SkillWithFiles | null> {
  const { data, error } = await supabase
    .from("skills")
    .select("*, skill_files(*)")
    .eq("skill_name", skillName)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSkillFromSupabase(skillName: string): Promise<boolean> {
  const { error } = await supabase
    .from("skills")
    .delete()
    .eq("skill_name", skillName);

  if (error) throw new Error(error.message);
  return true;
}
