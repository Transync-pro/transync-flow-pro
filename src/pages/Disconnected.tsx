import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const Disconnected = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
          <CardTitle className="text-2xl">Disconnected from QuickBooks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            You have been successfully disconnected from QuickBooks. You are still logged in to TransyncPro.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full bg-transyncpro-button hover:bg-transyncpro-button/90">
            <Link to="/connect-quickbooks">Connect to QuickBooks</Link>
          </Button>
          <Button asChild variant="outline" className="w-full mt-2">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Disconnected;
