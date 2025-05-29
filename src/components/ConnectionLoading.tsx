import { Loader2 } from "lucide-react";

interface ConnectionLoadingProps {
  message?: string;
  className?: string;
}

export const ConnectionLoading = ({ 
  message = "Loading...",
  className = "" 
}: ConnectionLoadingProps) => {
  return (
    <div className={`fixed inset-0 bg-white/80 flex items-center justify-center z-50 ${className}`}>
      <div className="text-center p-6 bg-white rounded-lg shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
};
