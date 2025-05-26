
import { Badge } from "@/components/ui/badge";
import { getEnvironment, isProduction } from "@/config/environment";

const EnvironmentIndicator = () => {
  const environment = getEnvironment();
  
  // Don't show indicator in production
  if (isProduction()) {
    return null;
  }
  
  const getVariant = () => {
    switch (environment) {
      case 'staging':
        return 'outline';
      default:
        return 'default';
    }
  };
  
  const getColor = () => {
    switch (environment) {
      case 'staging':
        return 'bg-yellow-500 text-black';
      default:
        return '';
    }
  };
  
  return (
    <div className="fixed top-2 right-2 z-50">
      <Badge variant={getVariant()} className={getColor()}>
        {environment.toUpperCase()}
      </Badge>
    </div>
  );
};

export default EnvironmentIndicator;
