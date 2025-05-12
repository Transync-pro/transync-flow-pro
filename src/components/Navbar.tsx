
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold gradient-text">TransyncPro</span>
            </Link>
          </div>
          
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
          
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-transyncpro-button hover:bg-transyncpro-button/90 text-white">Sign up</Button>
            </Link>
          </div>
          
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-transyncpro-button"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link to="/" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-transyncpro-heading hover:bg-gray-50 hover:border-transyncpro-heading">
            Home
          </Link>
          <Link to="/features" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-transyncpro-heading hover:bg-gray-50 hover:border-transyncpro-heading">
            Features
          </Link>
          <Link to="/pricing" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-transyncpro-heading hover:bg-gray-50 hover:border-transyncpro-heading">
            Pricing
          </Link>
          <Link to="/contact" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-transyncpro-heading hover:bg-gray-50 hover:border-transyncpro-heading">
            Contact
          </Link>
          <div className="flex flex-col space-y-2 px-4 pt-4">
            <Link to="/login">
              <Button variant="outline" className="w-full">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button className="w-full bg-transyncpro-button hover:bg-transyncpro-button/90 text-white">Sign up</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
