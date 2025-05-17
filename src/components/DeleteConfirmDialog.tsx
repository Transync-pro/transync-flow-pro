
import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Progress } from "./ui/progress";
import { Loader2 } from "lucide-react";
import { DeleteProgress } from "@/contexts/quickbooks/useEntityOperations";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  entityType: string;
  count: number;
  isDeleting: boolean;
  progress: DeleteProgress;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  entityType,
  count,
  isDeleting,
  progress,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDeleting
              ? `Deleting ${count} ${entityType} records...`
              : `Delete ${count} ${entityType} records?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDeleting ? (
              <div className="space-y-4">
                <p>Please wait while we process your request.</p>
                <Progress value={(progress.current / progress.total) * 100} />
                <p className="text-sm">
                  {progress.current} of {progress.total} processed (
                  {progress.success} succeeded, {progress.failed} failed)
                </p>
              </div>
            ) : (
              <p>
                This action will mark the selected {entityType} records as inactive in QuickBooks.
                This cannot be undone.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!isDeleting && (
            <>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </>
          )}
          {isDeleting && (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </div>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
