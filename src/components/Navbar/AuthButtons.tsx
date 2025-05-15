
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AuthButtons = () => {
  return (
    <div className="hidden md:flex items-center space-x-4">
      <Link to="/login">
        <Button variant="ghost">Log in</Button>
      </Link>
      <Link to="/signup">
        <Button className="bg-transyncpro-button hover:bg-transyncpro-button/90 text-white">Sign up</Button>
      </Link>
    </div>
  );
};

export default AuthButtons;
