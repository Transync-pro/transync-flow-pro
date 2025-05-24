import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useIdleTimeout } from '@/contexts/IdleTimeoutContext';
import { Clock } from 'lucide-react';

export const IdleWarningDialog: React.FC = () => {
  const { showWarning, remainingTime, resetTimer } = useIdleTimeout();
  
  // Format the remaining time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage (from 100% to 0%)
  // Using 30 seconds for testing (normally would be 120 seconds)
  const progressPercentage = (remainingTime / 30) * 100;
  
  return (
    <Dialog open={showWarning} onOpenChange={() => {}} modal={true}>
      <DialogContent className="sm:max-w-md" hideCloseButton={true} onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-500" />
          Session Timeout Warning
        </DialogTitle>
        <div className="py-4">
          <p className="mb-4">
            You've been inactive for a while. For security reasons, you'll be logged out in:
          </p>
          <div className="text-center mb-2 text-2xl font-bold">
            {formatTime(remainingTime)}
          </div>
          <Progress value={progressPercentage} className="h-2 mb-4" />
          <p className="text-sm text-muted-foreground">
            Click "Keep Me Logged In" to continue your session.
          </p>
        </div>
        <DialogFooter>
          <Button 
            onClick={resetTimer} 
            className="w-full"
          >
            Keep Me Logged In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
