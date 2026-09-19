import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TeamBundle } from "@/lib/useTeamData";

export interface ShareBundle extends TeamBundle {
  share: {
    show_fines: boolean;
    show_votes: boolean;
  };
}

export async function fetchShareBundle(token: string): Promise<ShareBundle> {
  const rpc = supabase.rpc as unknown as (
    functionName: string,
    args: Record<string, unknown>,
  ) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;

  const { data, error } = await rpc("get_share_bundle", {
    _token: token,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Share link not found or disabled");
  }

  return data as ShareBundle;
}

export function useShareBundle(token: string) {
  return useQuery({
    queryKey: ["share-link", token],
    queryFn: () => fetchShareBundle(token),
  });
}