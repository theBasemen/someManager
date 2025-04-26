import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { toast } from "@/components/ui/use-toast";
import LinkedInPostPreview from "./LinkedInPostPreview";
import FormSection from "./FormSection";
import ActionButtons from "./ActionButtons";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LinkedInPostGenerator = () => {
  // State management
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [flowId, setFlowId] = useState("");
  const [postText, setPostText] = useState("");
  const [editedText, setEditedText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [progress, setProgress] = useState(0);

  // Generate a unique flow ID
  const generateFlowId = () => {
    const newFlowId = `flow-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log("🆔 Generated new flowId:", newFlowId);
    setFlowId(newFlowId);
  };

  // Generate flow ID on component mount
  useEffect(() => {
    if (!flowId) {
      generateFlowId();
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    setProgress(10);

    try {
      // Generate a new flow ID for this request
      const newFlowId = `flow-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Create a clean JSON object without whitespace
      const payload = {
        topic: topic,
        audience: audience,
        flow_id: newFlowId,
      };

      // Convert to JSON string without pretty-printing
      const directJsonPayload = JSON.stringify(payload);

      console.log("🔴 DIRECT JSON PAYLOAD:", directJsonPayload);

      // Update state AFTER creating the payload
      setFlowId(newFlowId);

      const response = await fetch(
        "https://basemen.app.n8n.cloud/webhook/linkedin-start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: directJsonPayload,
        },
      );

      // Log response status
      console.log("📡 Webhook response status:", response.status);

      if (response.status !== 200) {
        console.error("❌ Non-200 response from webhook");
      } else {
        console.log("✅ Webhook call successful");
      }

      if (!response.ok) {
        throw new Error("Kunne ikke starte generering af opslag");
      }

      setProgress(30);
      // Reset post data
      setPostText("");
      setEditedText("");
      setImageUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Der opstod en fejl");
      setIsLoading(false);
    }
  };

  // Handle post approval
  const handleApprove = async () => {
    setIsLoading(true);
    setError("");

    try {
      const finalText = isEditing ? editedText : postText;

      const response = await fetch(
        "https://basemen.app.n8n.cloud/webhook/linkedin-approve",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            flowId,
            text: finalText,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Kunne ikke godkende opslaget");
      }

      setSuccess("Opslaget er godkendt og klar til offentliggørelse!");
      toast({
        title: "Opslag godkendt",
        description: "Dit LinkedIn opslag er nu klar til offentliggørelse!",
        variant: "default",
      });
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Der opstod en fejl ved godkendelse",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle editing mode toggle
  const handleEdit = () => {
    if (!isEditing) {
      setEditedText(postText);
    }
    setIsEditing(!isEditing);
  };

  // Reset form and state
  const resetForm = () => {
    setTopic("");
    setAudience("");
    setFlowId("");
    setPostText("");
    setEditedText("");
    setImageUrl("");
    setIsLoading(false);
    setIsEditing(false);
    setProgress(0);
    setError("");
    setSuccess("");
  };

  // Listen to Supabase for updates
  useEffect(() => {
    if (!flowId) return;

    // Set up interval to poll Supabase
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from("linkedin_drafts")
          .select("*")
          .eq("flow_id", flowId)
          .single();

        // Handle case where no data exists yet - this is normal during initialization
        if (error && error.code === "PGRST116") {
          // No rows returned - this is expected initially, just continue polling
          return;
        } else if (error) {
          // Only throw for other types of errors
          throw error;
        }

        if (data) {
          if (data.text && !postText) {
            setPostText(data.text);
            setProgress(70);
          }

          if (data.image_url && !imageUrl) {
            setImageUrl(data.image_url);
            setProgress(100);
            setIsLoading(false);
          }
        }
      } catch (err) {
        // Silent error for polling
        console.error("Polling error:", err);
      }
    }, 2000); // Poll every 2 seconds

    // Clean up interval on unmount or when flowId changes
    return () => clearInterval(pollInterval);
  }, [flowId, postText, imageUrl]);

  // Use Supabase real-time subscription
  useEffect(() => {
    if (!flowId) return;

    console.log(
      "🔌 Setting up Supabase real-time listener for flowId:",
      flowId,
    );

    // Create a unique channel name with the flowId to avoid conflicts
    const channelName = `linkedin_drafts_${flowId}`;

    // Subscribe to changes in the linkedin_drafts table
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen for all events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "linkedin_drafts",
          filter: `flow_id=eq.${flowId}`,
        },
        (payload) => {
          console.log(
            "📡 Supabase real-time event received:",
            payload.eventType,
            payload,
          );
          const { new: newData } = payload;

          if (newData.text && !postText) {
            console.log(
              "📝 Setting post text from real-time:",
              newData.text.substring(0, 50) + "...",
            );
            setPostText(newData.text);
            setEditedText(newData.text);
            setProgress(70);
          }

          if (newData.image_url && !imageUrl) {
            console.log(
              "🖼️ Setting image URL from real-time:",
              newData.image_url,
            );
            setImageUrl(newData.image_url);
            setProgress(100);
            setIsLoading(false);
          }
        },
      )
      .subscribe((status) => {
        console.log(`🔔 Supabase channel ${channelName} status:`, status);
      });

    // Clean up subscription
    return () => {
      console.log(`🔌 Unsubscribing from Supabase channel ${channelName}`);
      channel.unsubscribe();
    };
  }, [flowId, postText, imageUrl]);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-slate-800">
          Himmelstrup LinkedIn Opslag Generator
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            <FormSection
              topic={topic}
              audience={audience}
              isLoading={isLoading}
              error={error}
              success={success}
              progress={progress}
              setTopic={setTopic}
              setAudience={setAudience}
              handleSubmit={handleSubmit}
            />
          </div>

          {/* Center Column - LinkedIn Preview */}
          <div className="lg:col-span-1">
            <LinkedInPostPreview
              postText={postText}
              editedText={editedText}
              imageUrl={imageUrl}
              isLoading={isLoading}
              isEditing={isEditing}
              handleEdit={handleEdit}
              setEditedText={setEditedText}
            />
          </div>

          {/* Right Column - Action Buttons */}
          <div className="space-y-6">
            <ActionButtons
              isLoading={isLoading}
              postText={postText}
              imageUrl={imageUrl}
              isEditing={isEditing}
              handleEdit={handleEdit}
              handleApprove={handleApprove}
              resetForm={resetForm}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedInPostGenerator;
