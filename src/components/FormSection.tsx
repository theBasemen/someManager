import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import SuggestedTopicDropdown from "./SuggestedTopicDropdown";

interface FormSectionProps {
  topic: string;
  audience: string;
  isLoading: boolean;
  error: string;
  success: string;
  progress: number;
  setTopic: (topic: string) => void;
  setAudience: (audience: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

const FormSection: React.FC<FormSectionProps> = ({
  topic,
  audience,
  isLoading,
  error,
  success,
  progress,
  setTopic,
  setAudience,
  handleSubmit,
}) => {
  const [resetDropdown, setResetDropdown] = useState(false);

  // Handle suggestion selection
  const handleSuggestionSelect = (
    selectedTopic: string,
    selectedAudience: string,
  ) => {
    setTopic(selectedTopic);
    setAudience(selectedAudience);
    setResetDropdown(false);
  };

  // Reset dropdown when user manually types in the fields
  const handleManualInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void,
  ) => {
    setter(e.target.value);
    setResetDropdown(true);
  };

  // Reset the resetDropdown flag after it's been processed
  useEffect(() => {
    if (resetDropdown) {
      setResetDropdown(false);
    }
  }, [resetDropdown]);

  return (
    <Card className="shadow-md border border-slate-200">
      <CardHeader>
        <CardTitle>Opret LinkedIn Opslag</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <SuggestedTopicDropdown
            onSuggestionSelect={handleSuggestionSelect}
            resetSelection={resetDropdown}
          />

          <div className="space-y-2">
            <Label htmlFor="topic">Emne</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => handleManualInput(e, setTopic)}
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
              onChange={(e) => handleManualInput(e, setAudience)}
              placeholder="F.eks. Event koordinatorer i København"
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Genererer..." : "Generér opslag"}
          </Button>
        </form>

        {isLoading && (
          <div className="mt-6 space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Genererer LinkedIn opslag...
            </p>
            <Progress value={progress} className="h-2" />
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
    </Card>
  );
};

export default FormSection;
