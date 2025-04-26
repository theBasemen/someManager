import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface UseSupabaseListenerProps {
  flowId: string;
  onTextReceived?: (text: string) => void;
  onImageReceived?: (imageUrl: string) => void;
  enabled?: boolean;
}

export function useSupabaseListener({
  flowId,
  onTextReceived,
  onImageReceived,
  enabled = true,
}: UseSupabaseListenerProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!flowId || !enabled) return;

    console.log("🔌 Setting up Supabase listener for flowId:", flowId);

    // Create a unique channel name with the flowId to avoid conflicts
    const channelName = `linkedin_drafts_${flowId}_${Math.random().toString(36).substring(2, 9)}`;

    // First, check if there's already data in the database
    const fetchInitialData = async () => {
      try {
        console.log("📊 Fetching initial data for flowId:", flowId);
        const { data, error } = await supabase
          .from("linkedin_drafts")
          .select("*")
          .eq("flow_id", flowId)
          .single();

        if (error) {
          console.log("⚠️ No initial data found:", error.message);
          return;
        }

        console.log("📦 Initial data found:", data);

        if (data) {
          if (data.text && onTextReceived) {
            console.log(
              "📝 Setting initial text:",
              data.text.substring(0, 50) + "...",
            );
            onTextReceived(data.text);
          }

          if (data.image_url && onImageReceived) {
            console.log("🖼️ Setting initial image URL:", data.image_url);
            onImageReceived(data.image_url);
          }
        }
      } catch (err) {
        console.error("❌ Error fetching initial data:", err);
      }
    };

    fetchInitialData();

    // Set up real-time listener
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all events
          schema: "public",
          table: "linkedin_drafts",
          filter: `flow_id=eq.${flowId}`,
        },
        (payload) => {
          console.log(
            "📡 Supabase event received:",
            payload.eventType,
            payload,
          );
          setLastEvent(payload);

          const { new: newData } = payload;

          if (newData.text && onTextReceived) {
            console.log(
              "📝 Text received from real-time:",
              newData.text.substring(0, 50) + "...",
            );
            onTextReceived(newData.text);
          }

          if (newData.image_url && onImageReceived) {
            console.log(
              "🖼️ Image URL received from real-time:",
              newData.image_url,
            );
            onImageReceived(newData.image_url);
          }
        },
      )
      .subscribe((status) => {
        console.log(`🔔 Supabase channel ${channelName} status:`, status);
        setIsConnected(status === "SUBSCRIBED");
      });

    // Set up polling as a fallback
    const pollInterval = setInterval(async () => {
      try {
        console.log("🔄 Polling for flowId:", flowId);
        const { data, error } = await supabase
          .from("linkedin_drafts")
          .select("*")
          .eq("flow_id", flowId)
          .single();

        if (error) {
          console.log("⚠️ Polling found no data:", error.message);
          return;
        }

        console.log("📦 Polling data received:", data);

        if (data) {
          if (data.text && onTextReceived) {
            console.log(
              "📝 Text from polling:",
              data.text.substring(0, 50) + "...",
            );
            onTextReceived(data.text);
          }

          if (data.image_url && onImageReceived) {
            console.log("🖼️ Image URL from polling:", data.image_url);
            onImageReceived(data.image_url);
          }
        }
      } catch (err) {
        console.error("❌ Polling error:", err);
        setError(
          err instanceof Error ? err.message : "Unknown error during polling",
        );
      }
    }, 3000);

    // Clean up
    return () => {
      console.log(`🛑 Cleaning up Supabase listener for flowId: ${flowId}`);
      channel.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [flowId, enabled, onTextReceived, onImageReceived]);

  return { isConnected, lastEvent, error };
}
