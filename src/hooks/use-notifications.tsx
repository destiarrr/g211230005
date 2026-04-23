import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchNotifications, type Notification } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          toast[n.type === "error" ? "error" : n.type === "warning" ? "warning" : n.type === "success" ? "success" : "info"](
            n.title,
            { description: n.body ?? undefined },
          );
          qc.invalidateQueries({ queryKey: ["notifications", user.id] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications", user.id] });
  };

  const unread = (query.data ?? []).filter((n) => !n.read).length;
  return { notifications: query.data ?? [], unread, isLoading: query.isLoading, markAllRead };
}

// Lightweight broadcast: insert a notification for the current user
export function useNotify() {
  const { user } = useAuth();
  return async (title: string, body?: string, type: Notification["type"] = "info") => {
    if (!user) return;
    await supabase.from("notifications").insert({ user_id: user.id, title, body, type });
  };
}

// Standalone hook for low-stock alert badge in header
export function useLowStockCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    void supabase
      .from("stock_items")
      .select("id, current_qty, min_qty")
      .then(({ data }) => {
        const low = (data ?? []).filter((s) => s.current_qty <= s.min_qty).length;
        setCount(low);
      });
  }, []);
  return count;
}
