
import { isStaging } from '@/config/environment';

const EnvironmentBadge = () => {
  if (!isStaging()) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold shadow-lg">
        STAGING
      </span>
    </div>
  );
};

export default EnvironmentBadge;
