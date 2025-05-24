
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import NavLinks from "./Navbar/NavLinks";
import UserMenu from "./Navbar/UserMenu";
import AuthButtons from "./Navbar/AuthButtons";
import MobileMenu from "./Navbar/MobileMenu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { isConnected, isLoading: qbLoading } = useQuickbooks();
  const [hasQbConnection, setHasQbConnection] = useState(false);

  // Direct check for QuickBooks connection in the database
  useEffect(() => {
    const checkQbConnection = async () => {
      if (!user) {
        setHasQbConnection(false);
        return;
      }

      try {
        // Using count query instead of select to avoid 406 errors
        const { count, error } = await supabase
          .from('quickbooks_connections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        setHasQbConnection(!error && (count || 0) > 0);
      } catch (error) {
        console.error('Error checking QB connection:', error);
        setHasQbConnection(false);
      }
    };

    checkQbConnection();
    
    // Set up periodic check
    const interval = setInterval(checkQbConnection, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully"
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Loading state while checking auth and QB status
  if (authLoading) {
    return (
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <img 
                  src="/TransyncProLogo.png" 
                  alt="TransyncPro" 
                  className="h-8"
                />
              </Link>
            </div>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img 
                src="/TransyncProLogo.png" 
                alt="TransyncPro" 
                className="h-8"
              />
            </Link>
          </div>
          
          <NavLinks />
          
          {/* Show dashboard link for authenticated users with QB connection */}
          {user && hasQbConnection && (
            <div className="hidden md:flex md:items-center">
              <Link to="/dashboard" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-transyncpro-heading hover:border-transyncpro-heading">
                Dashboard
              </Link>
            </div>
          )}
          
          {/* Show Connect QuickBooks link for authenticated users without QB connection */}
          {user && !hasQbConnection && (
            <div className="hidden md:flex md:items-center">
              <Link to="/authenticate" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-transyncpro-heading hover:border-transyncpro-heading">
                Connect QuickBooks
              </Link>
            </div>
          )}
          
          {/* Show login/signup for unauthenticated users */}
          {!user && <AuthButtons />}
          
          {/* Show profile dropdown for authenticated users */}
          {user && <UserMenu user={user} hasQbConnection={hasQbConnection} signOut={handleSignOut} />}
          
          {/* Mobile menu button */}
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
      <MobileMenu 
        isOpen={isMenuOpen}
        toggleMenu={toggleMenu}
        isAuthenticated={!!user}
        hasQbConnection={hasQbConnection}
        signOut={handleSignOut}
      />
    </nav>
  );
};

export default Navbar;
