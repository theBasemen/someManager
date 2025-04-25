import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle, Edit, Send } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

// Use environment variables for Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const Home = () => {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [flowId, setFlowId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [postText, setPostText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState("");
  const { toast } = useToast();

  // Simulate progress during generation
  useEffect(() => {
    let interval;
    if (isLoading && progress < 90) {
      interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoading, progress]);

  // Listen to Supabase for updates
  useEffect(() => {
    if (!flowId) return;

    const subscription = supabase
      .channel("linkedin_drafts_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "linkedin_drafts",
          filter: `flow_id=eq.${flowId}`,
        },
        (payload) => {
          if (payload.new.text) {
            setPostText(payload.new.text);
            setEditedText(payload.new.text);
            setProgress(70);
          }
          if (payload.new.image_url) {
            setImageUrl(payload.new.image_url);
            setProgress(100);
            setIsLoading(false);
          }
        },
      )
      .subscribe();

    // Polling fallback (in case real-time doesn't work)
    const pollInterval = setInterval(async () => {
      if (!isLoading) return;

      const { data } = await supabase
        .from("linkedin_drafts")
        .select("text, image_url")
        .eq("flow_id", flowId)
        .single();

      if (data) {
        if (data.text && !postText) {
          setPostText(data.text);
          setEditedText(data.text);
          setProgress(70);
        }
        if (data.image_url && !imageUrl) {
          setImageUrl(data.image_url);
          setProgress(100);
          setIsLoading(false);
        }
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [flowId, isLoading, postText, imageUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic || !audience) return;

    setIsLoading(true);
    setProgress(10);
    setPostText("");
    setImageUrl("");
    setIsEditing(false);

    try {
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
          }),
        },
      );

      const data = await response.json();
      setFlowId(data.flowId);
      setProgress(30);
    } catch (error) {
      console.error("Error starting generation:", error);
      toast({
        title: "Fejl",
        description:
          "Der opstod en fejl ved generering af opslaget. Prøv igen.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await fetch("https://basemen.app.n8n.cloud/webhook/linkedin-approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flowId,
          text: editedText,
        }),
      });

      toast({
        title: "Succes!",
        description:
          "LinkedIn-opslaget er godkendt og klar til offentliggørelse.",
        variant: "default",
      });

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Error approving post:", error);
      toast({
        title: "Fejl",
        description:
          "Der opstod en fejl ved godkendelse af opslaget. Prøv igen.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTopic("");
    setAudience("");
    setFlowId("");
    setIsLoading(false);
    setProgress(0);
    setPostText("");
    setImageUrl("");
    setIsEditing(false);
    setEditedText("");
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">
            Himmelstrup Social Media Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Generer, gennemgå og godkend LinkedIn-opslag med AI-assistance
          </p>
        </header>

        <Card className="bg-card">
          {!isLoading && !postText ? (
            <>
              <CardHeader>
                <CardTitle>Opret nyt LinkedIn-opslag</CardTitle>
                <CardDescription>
                  Udfyld formularen nedenfor for at generere et nyt
                  LinkedIn-opslag
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Emne</Label>
                    <Input
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="F.eks. Bæredygtige firmaarrangementer"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audience">Målgruppe</Label>
                    <Input
                      id="audience"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="F.eks. HR-chefer i mellemstore virksomheder"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Generér opslag
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle>
                  {isLoading
                    ? "Genererer LinkedIn-opslag..."
                    : "Gennemgå LinkedIn-opslag"}
                </CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Vent venligst mens vi genererer dit opslag med AI"
                    : "Gennemgå og rediger dit opslag før godkendelse"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span>
                        {progress < 30
                          ? "Starter generering..."
                          : progress < 70
                            ? "Genererer tekst..."
                            : "Genererer billede..."}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {postText && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">LinkedIn-tekst</h3>
                      {isEditing ? (
                        <Textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="min-h-[200px]"
                        />
                      ) : (
                        <div className="p-4 border rounded-md bg-muted/30 whitespace-pre-wrap">
                          {editedText}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Billede</h3>
                      {imageUrl ? (
                        <div className="overflow-hidden rounded-md border">
                          <img
                            src={imageUrl}
                            alt="Generated LinkedIn post image"
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-64 rounded-md border flex items-center justify-center bg-muted/30">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>

              {postText && !isLoading && (
                <CardFooter className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-between">
                  <div className="flex space-x-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {isEditing ? "Afslut redigering" : "Rediger tekst"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={resetForm}
                      className="flex-1 sm:flex-none"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Annuller
                    </Button>
                  </div>
                  <Button
                    onClick={handleApprove}
                    className="w-full sm:w-auto"
                    disabled={!imageUrl}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Godkend og offentliggør
                  </Button>
                </CardFooter>
              )}
            </>
          )}
        </Card>
      </div>
      <Toaster />
    </div>
  );
};

export default Home;
