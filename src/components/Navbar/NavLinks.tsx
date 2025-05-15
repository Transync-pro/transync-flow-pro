
import { Link } from "react-router-dom";

const NavLinks = () => {
  return (
    <div className="hidden md:ml-6 md:flex md:space-x-8">
      <Link to="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-transyncpro-heading hover:border-transyncpro-heading">
        Home
      </Link>
      <Link to="/features" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-transyncpro-heading hover:border-transyncpro-heading">
        Features
      </Link>
      <Link to="/pricing" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-transyncpro-heading hover:border-transyncpro-heading">
        Pricing
      </Link>
      <Link to="/contact" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-transyncpro-heading hover:border-transyncpro-heading">
        Contact
      </Link>
    </div>
  );
};

export default NavLinks;
