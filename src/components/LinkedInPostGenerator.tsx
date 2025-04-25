import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, Edit, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PostPreview from "./PostPreview";
import { motion } from "framer-motion";

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    setProgress(10);

    try {
      // Generate a unique flow ID
      const newFlowId = `flow-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setFlowId(newFlowId);

      // Send request to n8n webhook
      const response = await fetch(
        "https://basemen.app.n8n.cloud/webhook/linkedin-start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic,
            audience,
            flowId: newFlowId,
          }),
        },
      );

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

        if (error) throw error;

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

  // Alternatively, use Supabase real-time subscription
  useEffect(() => {
    if (!flowId) return;

    // Subscribe to changes in the linkedin_drafts table
    const subscription = supabase
      .channel("linkedin_drafts_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "linkedin_drafts",
          filter: `flow_id=eq.${flowId}`,
        },
        (payload) => {
          const { new: newData } = payload;

          if (newData.text && !postText) {
            setPostText(newData.text);
            setProgress(70);
          }

          if (newData.image_url && !imageUrl) {
            setImageUrl(newData.image_url);
            setProgress(100);
            setIsLoading(false);
          }
        },
      )
      .subscribe();

    // Clean up subscription
    return () => {
      supabase.channel("linkedin_drafts_changes").unsubscribe();
    };
  }, [flowId, postText, imageUrl]);

  return (
    <div className="bg-background min-h-screen p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Himmelstrup LinkedIn Opslag Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!flowId || (!postText && !imageUrl) ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">Emne</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="F.eks. Bæredygtige events"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Målgruppe</Label>
                <Input
                  id="audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="F.eks. Event koordinatorer i København"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Genererer..." : "Generér opslag"}
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              {isLoading && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Genererer LinkedIn opslag...
                  </p>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-text">Rediger opslag tekst</Label>
                  <Textarea
                    id="edit-text"
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="min-h-[200px]"
                  />
                </div>
              ) : (
                <PostPreview
                  text={postText}
                  imageUrl={imageUrl}
                  isLoading={isLoading}
                />
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  {success}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </CardContent>

        {(postText || imageUrl) && (
          <CardFooter className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={resetForm}
              className="w-full sm:w-auto"
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" />
              Annuller
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              className="w-full sm:w-auto"
              disabled={isLoading}
            >
              <Edit className="mr-2 h-4 w-4" />
              {isEditing ? "Vis forhåndsvisning" : "Rediger tekst"}
            </Button>
            <Button
              onClick={handleApprove}
              className="w-full sm:w-auto"
              disabled={isLoading || !postText}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Godkend og offentliggør
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default LinkedInPostGenerator;
