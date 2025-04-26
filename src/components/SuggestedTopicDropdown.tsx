import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Suggestion {
  id: string;
  topic: string;
  audience: string;
  used: boolean;
}

interface SuggestedTopicDropdownProps {
  onSuggestionSelect: (topic: string, audience: string) => void;
  resetSelection: boolean;
}

const SuggestedTopicDropdown: React.FC<SuggestedTopicDropdownProps> = ({
  onSuggestionSelect,
  resetSelection,
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedValue, setSelectedValue] = useState<string>("");

  // Reset the dropdown selection when resetSelection is true
  useEffect(() => {
    if (resetSelection) {
      setSelectedValue("");
    }
  }, [resetSelection]);

  // Fetch suggestions from Supabase
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("suggested_topics")
          .select("id, topic, audience, used")
          .order("used", { ascending: true })
          .order("topic", { ascending: true });

        if (error) throw new Error(error.message);

        setSuggestions(data || []);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setError("Kunne ikke hente forslag. Prøv igen senere.");
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const handleSuggestionChange = (value: string) => {
    setSelectedValue(value);

    if (value) {
      const selectedSuggestion = suggestions.find((s) => s.id === value);
      if (selectedSuggestion) {
        onSuggestionSelect(
          selectedSuggestion.topic,
          selectedSuggestion.audience,
        );
      }
    }
  };

  // If there's an error or no suggestions, don't render the dropdown
  if (error || (suggestions.length === 0 && !loading)) {
    return error ? (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    ) : null;
  }

  return (
    <div className="space-y-2 mb-4">
      <Select
        value={selectedValue}
        onValueChange={handleSuggestionChange}
        disabled={loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Vælg et forslag" />
        </SelectTrigger>
        <SelectContent>
          {suggestions.map((suggestion) => (
            <SelectItem
              key={suggestion.id}
              value={suggestion.id}
              disabled={suggestion.used}
              className={suggestion.used ? "text-gray-400" : ""}
            >
              {suggestion.topic} (for {suggestion.audience})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SuggestedTopicDropdown;
