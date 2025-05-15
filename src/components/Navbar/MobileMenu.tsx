
import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  isOpen: boolean;
  toggleMenu: () => void;
  isAuthenticated: boolean;
  hasQbConnection: boolean;
  signOut: () => Promise<void>;
}

const MobileMenu = ({ 
  isOpen, 
  toggleMenu, 
  isAuthenticated, 
  hasQbConnection,
  signOut
}: MobileMenuProps) => {
  return (
    <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
      <div className="pt-2 pb-3 space-y-1">
        <Link to="/" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">
          Home
        </Link>
        <Link to="/features" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">
          Features
        </Link>
        <Link to="/pricing" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">
          Pricing
        </Link>
        <Link to="/contact" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">
          Contact
        </Link>
        
        {/* Show Dashboard link only for authenticated users with QB connection */}
        {isAuthenticated && hasQbConnection && (
          <Link to="/dashboard" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">
            Dashboard
          </Link>
        )}
        
        {/* Show Disconnected link for authenticated users without QB connection */}
        {isAuthenticated && !hasQbConnection && (
          <Link to="/disconnected" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">
            Connect QuickBooks
          </Link>
        )}
        
        {/* Show login/signup for unauthenticated users */}
        {!isAuthenticated ? (
          <div className="flex flex-col space-y-2 px-4 pt-4">
            <Link to="/login">
              <Button variant="outline" className="w-full">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button className="w-full bg-transyncpro-button hover:bg-transyncpro-button/90 text-white">Sign up</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col space-y-2 px-4 pt-4">
            <Link to="/profile">
              <Button variant="outline" className="w-full">Profile Settings</Button>
            </Link>
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={signOut}
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMenu;
