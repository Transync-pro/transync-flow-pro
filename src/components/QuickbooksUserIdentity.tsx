
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuickbooks } from '@/contexts/QuickbooksContext';
import { useQBUserIdentity } from '@/contexts/quickbooks/useQBUserIdentity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface QuickbooksUserIdentityProps {
  className?: string;
}

const QuickbooksUserIdentity: React.FC<QuickbooksUserIdentityProps> = ({ className }) => {
  const { user } = useAuth();
  const { isConnected } = useQuickbooks();
  const { userIdentity, isLoading, error } = useQBUserIdentity(user, isConnected);
  
  if (!isConnected) {
    return null;
  }
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>QuickBooks User</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>QuickBooks User</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 text-sm">Error loading user information</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!userIdentity) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>QuickBooks User</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No user information available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>QuickBooks User</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {userIdentity.first_name && userIdentity.last_name && (
          <div>
            <span className="font-semibold">Name:</span> {userIdentity.first_name} {userIdentity.last_name}
          </div>
        )}
        
        {userIdentity.email && (
          <div>
            <span className="font-semibold">Email:</span> {userIdentity.email}
          </div>
        )}
        
        {userIdentity.phone_number && (
          <div>
            <span className="font-semibold">Phone:</span> {userIdentity.phone_number}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickbooksUserIdentity;
