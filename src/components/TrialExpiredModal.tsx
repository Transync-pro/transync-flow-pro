
import React from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check } from "lucide-react";

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TrialExpiredModal = ({ isOpen, onClose }: TrialExpiredModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-center">
            <Crown className="mr-2 h-6 w-6 text-yellow-500" />
            Trial Expired
          </DialogTitle>
          <DialogDescription className="text-center">
            Your free trial has ended. Continue enjoying all the features with a paid plan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">What you've experienced:</h4>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                Full access to QuickBooks integration
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                Bulk import and export capabilities
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" />
                Advanced data management tools
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Link to="/subscription" className="w-full">
              <Button className="w-full bg-transyncpro-button hover:bg-transyncpro-button/90">
                Choose Your Plan
              </Button>
            </Link>
            <Button variant="outline" onClick={onClose} className="w-full">
              Browse Features (Limited Access)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrialExpiredModal;
