
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, BellRing } from "lucide-react";
import { Link } from "react-router-dom";

interface ComingSoonProps {
  title: string;
  description: string;
  estimatedRelease?: string;
  features?: string[];
}

const ComingSoon = ({ 
  title, 
  description, 
  estimatedRelease = "Coming Soon", 
  features = [] 
}: ComingSoonProps) => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        <p className="text-gray-500">{description}</p>
      </div>
      
      <Card className="border border-blue-100 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-blue-800">
            <Clock className="h-5 w-5 inline-block mr-2 text-blue-500" />
            {estimatedRelease}
          </CardTitle>
          <CardDescription>We're working hard to bring you these features</CardDescription>
        </CardHeader>
        <CardContent>
          {features.length > 0 && (
            <div className="mt-4 space-y-3">
              <h3 className="font-medium text-blue-900">Planned Features:</h3>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="bg-blue-100 rounded-full p-1 mt-0.5 mr-2">
                      <BellRing className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="mt-6">
            <Button variant="outline" asChild>
              <Link to="/dashboard" className="flex items-center">
                Back to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;
