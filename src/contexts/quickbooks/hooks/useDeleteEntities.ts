
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { DeleteProgress } from "../types";
import { logOperation } from "@/utils/operationLogger";

export const useDeleteEntities = (
  userId: string | undefined,
  selectedEntity: string | null,
  fetchEntities: (entityType?: string) => Promise<void>
) => {
  // Delete progress tracking
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<DeleteProgress>({
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    details: [],
  });

  // Function to delete a single entity
  const deleteEntity = useCallback(async (entityType: string, entityId: string): Promise<boolean> => {
    const typeToDelete = entityType || selectedEntity;
    if (!typeToDelete || !userId) return false;
    
    try {
      console.log(`Attempting to delete ${typeToDelete} with ID ${entityId}`);
      
      // Call our edge function to delete the entity
      const { data, error } = await supabase.functions.invoke("quickbooks-entities", {
        body: {
          operation: "delete",
          entityType: typeToDelete,
          userId: userId,
          id: entityId
        }
      });
      
      if (error) {
        throw new Error(`Error invoking function: ${error.message}`);
      }
      
      if (data.error) {
        throw new Error(`Error from function: ${data.error}`);
      }
      
      // Log the successful deletion
      try {
        await logOperation({
          operationType: 'delete',
          entityType: typeToDelete,
          recordId: entityId,
          status: 'success',
          details: {
            entityId,
            action: 'delete',
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error('Failed to log delete operation:', logError);
        // Continue even if logging fails
      }
      
      // Show success message
      toast({
        title: "Entity Deleted",
        description: `Successfully deleted ${typeToDelete} with ID ${entityId}`,
      });
      
      return true;
    } catch (error: any) {
      console.error(`Error deleting ${typeToDelete}:`, error);
      
      // Log the failed deletion
      try {
        await logOperation({
          operationType: 'delete',
          entityType: typeToDelete,
          recordId: entityId,
          status: 'error',
          details: {
            entityId,
            error: error.message || 'Unknown error during deletion',
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error('Failed to log delete error:', logError);
      }
      
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  }, [selectedEntity, userId]);
  
  // Function to delete multiple entities
  const deleteSelectedEntities = useCallback(async (entityIds: string[], entityType?: string) => {
    const typeToDelete = entityType || selectedEntity;
    if (!typeToDelete || entityIds.length === 0) return;
    
    // Initialize progress
    const progress = {
      total: entityIds.length,
      current: 0,
      success: 0,
      failed: 0,
      details: [] as Array<{id: string, status: string, error?: string}>
    };
    
    setIsDeleting(true);
    setDeleteProgress(progress);
    
    try {
      // Log the start of batch deletion
      await logOperation({
        operationType: 'delete',
        entityType: typeToDelete,
        status: 'pending',
        details: {
          batch: true,
          totalCount: entityIds.length,
          timestamp: new Date().toISOString()
        }
      });
      
      // Process each entity deletion
      for (let i = 0; i < entityIds.length; i++) {
        const id = entityIds[i];
        try {
          const success = await deleteEntity(typeToDelete, id);
          
          if (success) {
            progress.success++;
            progress.details.push({ id, status: 'success' });
          } else {
            progress.failed++;
            progress.details.push({ 
              id, 
              status: 'error', 
              error: 'Failed to delete' 
            });
          }
        } catch (error: any) {
          progress.failed++;
          progress.details.push({ 
            id, 
            status: 'error', 
            error: error.message || 'Unknown error during deletion' 
          });
        } finally {
          progress.current = i + 1;
          setDeleteProgress({...progress});
        }
      }
      
      // Log the completion of batch deletion
      const status = progress.failed === 0 ? 'success' : 
                    progress.success === 0 ? 'error' : 'partial';
      
      await logOperation({
        operationType: 'delete',
        entityType: typeToDelete,
        status,
        details: {
          batch: true,
          total: progress.total,
          success: progress.success,
          failed: progress.failed,
          timestamp: new Date().toISOString()
        }
      });
      
      // Refresh the entities after bulk deletion
      await fetchEntities(typeToDelete);
      
    } catch (error: any) {
      console.error("Error in bulk deletion:", error);
      
      // Log the bulk deletion error
      await logOperation({
        operationType: 'delete',
        entityType: typeToDelete || 'unknown',
        status: 'error',
        details: {
          error: error.message,
          operation: 'bulk-delete'
        }
      });
      
      toast({
        title: "Bulk Deletion Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteEntity, selectedEntity, fetchEntities]);

  return {
    deleteEntity,
    deleteSelectedEntities,
    isDeleting,
    deleteProgress
  };
};
