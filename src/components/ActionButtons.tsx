import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, X, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActionButtonsProps {
  isLoading: boolean;
  postText: string;
  imageUrl: string;
  isEditing: boolean;
  handleEdit: () => void;
  handleApprove: () => Promise<void>;
  resetForm: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isLoading,
  postText,
  imageUrl,
  isEditing,
  handleEdit,
  handleApprove,
  resetForm,
}) => {
  return (
    <Card className="shadow-md border border-slate-200">
      <CardHeader>
        <CardTitle>Handlinger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <Button
            variant="outline"
            onClick={handleEdit}
            disabled={isLoading || !postText}
            className="w-full justify-start"
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? "Vis forhåndsvisning" : "Rediger tekst"}
          </Button>

          <Button
            onClick={handleApprove}
            disabled={isLoading || !postText || !imageUrl}
            className="w-full justify-start"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Godkend og offentliggør
          </Button>

          <Button
            variant="outline"
            onClick={resetForm}
            className="w-full justify-start"
          >
            <X className="h-4 w-4 mr-2" />
            Start forfra
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionButtons;
