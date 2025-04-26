import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, MessageSquare, Repeat2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LinkedInPostPreviewProps {
  postText: string;
  editedText: string;
  imageUrl: string;
  isLoading: boolean;
  isEditing: boolean;
  handleEdit: () => void;
  setEditedText: (text: string) => void;
}

const LinkedInPostPreview: React.FC<LinkedInPostPreviewProps> = ({
  postText,
  editedText,
  imageUrl,
  isLoading,
  isEditing,
  handleEdit,
  setEditedText,
}) => {
  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6 border border-slate-100">
      <Card className="shadow-sm border border-slate-200 overflow-hidden max-w-xl mx-auto">
        {/* Company Profile Header */}
        <div className="p-4 flex items-center gap-3 border-b border-slate-100">
          <Avatar className="h-12 w-12 border border-slate-200">
            <div className="bg-primary h-full w-full flex items-center justify-center text-primary-foreground font-semibold text-lg">
              HE
            </div>
          </Avatar>
          <div>
            <h3 className="font-semibold">Himmelstrup Events</h3>
            <p className="text-xs text-muted-foreground">
              Virksomhed • Event Management
            </p>
            <p className="text-xs text-muted-foreground">1t • Redigeret</p>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Post Text Section */}
          <div className="p-4">
            {isLoading && !postText ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ) : isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="min-h-[120px] w-full"
                  placeholder="Rediger LinkedIn opslagstekst her..."
                />
                <Button onClick={handleEdit} size="sm">
                  Gem ændringer
                </Button>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm min-h-[100px]">
                {postText || "Dit LinkedIn opslag vil blive vist her..."}
              </div>
            )}
          </div>

          {/* Image Preview Section */}
          <div className="border-t border-slate-100">
            {isLoading && !imageUrl ? (
              <Skeleton className="h-48 w-full" />
            ) : imageUrl ? (
              <div>
                <img
                  src={imageUrl}
                  alt="LinkedIn post billede"
                  className="w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-48 w-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
                Billede vil blive vist her
              </div>
            )}
          </div>

          {/* LinkedIn Interaction Bar */}
          <div className="border-t border-slate-100 p-2 flex justify-between text-slate-500">
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs">0</span>
            </div>
            <div className="text-xs">0 kommentarer</div>
          </div>

          {/* LinkedIn Action Buttons */}
          <div className="border-t border-slate-100 p-2 grid grid-cols-4 gap-1 text-slate-600">
            <button className="flex items-center justify-center gap-2 py-1 rounded-md hover:bg-slate-100">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs font-medium">Synes godt om</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-1 rounded-md hover:bg-slate-100">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs font-medium">Kommenter</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-1 rounded-md hover:bg-slate-100">
              <Repeat2 className="h-4 w-4" />
              <span className="text-xs font-medium">Gendel</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-1 rounded-md hover:bg-slate-100">
              <Send className="h-4 w-4" />
              <span className="text-xs font-medium">Send</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedInPostPreview;
