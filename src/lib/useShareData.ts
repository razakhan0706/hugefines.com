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
  // Call rpc as a method on the client — aliasing `supabase.rpc` unbinds `this`
  // and throws before any request is made.
  const { data, error } = (await supabase.rpc(
    "get_share_bundle" as never,
    { _token: token } as never,
  )) as unknown as {
    data: unknown;
    error: { message: string } | null;
  };

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
