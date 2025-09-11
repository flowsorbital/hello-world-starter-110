import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useBatchPolling() {
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();

  const startPolling = async (batchId: string, userId: string) => {
    try {
      setIsPolling(true);
      
      console.log('Starting batch polling for:', batchId);
      
      const { data, error } = await supabase.functions.invoke('poll-batch-status', {
        body: {
          batchId,
          userId,
        },
      });

      if (error) {
        console.error('Error starting batch polling:', error);
        toast({
          title: "Error",
          description: "Failed to start batch status polling",
          variant: "destructive",
        });
        return false;
      }

      console.log('Batch polling completed:', data);
      
      if (data?.completed) {
        toast({
          title: "Success",
          description: "Batch processing completed successfully",
        });
      } else {
        toast({
          title: "Warning",
          description: "Batch polling finished but may not be complete",
          variant: "destructive",
        });
      }

      return data?.completed || false;

    } catch (error) {
      console.error('Error in batch polling:', error);
      toast({
        title: "Error",
        description: "Failed to poll batch status",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsPolling(false);
    }
  };

  return {
    startPolling,
    isPolling,
  };
}