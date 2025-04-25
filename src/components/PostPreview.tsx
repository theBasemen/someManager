import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

interface PostPreviewProps {
  flowId?: string;
  postText?: string;
  imageUrl?: string | null;
  isLoading?: boolean;
  onEdit?: (text: string) => void;
  onApprove?: (flowId: string, text: string) => void;
  onCancel?: () => void;
}

const PostPreview = ({
  flowId = "",
  postText = "",
  imageUrl = null,
  isLoading = false,
  onEdit = () => {},
  onApprove = () => {},
  onCancel = () => {},
}: PostPreviewProps) => {
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState(postText);

  // Update edited text when postText changes (e.g., when it first loads)
  React.useEffect(() => {
    setEditedText(postText);
  }, [postText]);

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleSaveEdit = () => {
    onEdit(editedText);
    setEditMode(false);
  };

  const handleApprove = () => {
    onApprove(flowId, editedText || postText);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-background">
      <Card className="shadow-md">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-xl font-semibold mb-4">
            LinkedIn Opslag Forhåndsvisning
          </h2>

          {/* Post Text Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Opslagstekst
            </h3>
            {isLoading && !postText ? (
              <Skeleton className="h-32 w-full" />
            ) : editMode ? (
              <div className="space-y-2">
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="min-h-[150px] w-full"
                  placeholder="Rediger LinkedIn opslagstekst her..."
                />
                <Button onClick={handleSaveEdit} size="sm">
                  Gem ændringer
                </Button>
              </div>
            ) : (
              <div className="p-4 border rounded-md bg-muted/30 whitespace-pre-wrap">
                {postText || "Venter på genereret tekst..."}
              </div>
            )}
          </div>

          {/* Image Preview Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Opslagsbillede
            </h3>
            {isLoading || !imageUrl ? (
              <div className="aspect-video w-full bg-muted/30 rounded-md flex items-center justify-center">
                <Skeleton className="h-full w-full rounded-md" />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-md overflow-hidden">
                <img
                  src={imageUrl}
                  alt="LinkedIn post billede"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleEditClick}
              disabled={isLoading || !postText}
            >
              Rediger tekst
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isLoading || !postText || !imageUrl}
            >
              Godkend og offentliggør
            </Button>
            <Button variant="destructive" onClick={onCancel}>
              Annuller
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostPreview;
