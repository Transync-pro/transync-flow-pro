
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuickbooks } from "@/contexts/QuickbooksContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { isConnected, isLoading: qbLoading } = useQuickbooks();
  const [hasQbConnection, setHasQbConnection] = useState(false);
  const navigate = useNavigate();

  // Direct check for QuickBooks connection in the database
  useEffect(() => {
    const checkQbConnection = async () => {
      if (!user) {
        setHasQbConnection(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('quickbooks_connections')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        setHasQbConnection(!error && !!data);
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
      navigate('/');
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

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.user_metadata?.full_name) return "U";
    
    const fullName = user.user_metadata.full_name;
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length-1][0]}`.toUpperCase();
    }
    return fullName[0].toUpperCase();
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
                <span className="text-2xl font-bold gradient-text">TransyncPro</span>
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
            
            {/* Show Dashboard link only for authenticated users with QB connection */}
            {user && hasQbConnection && (
              <Link to="/dashboard" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-transyncpro-heading hover:border-transyncpro-heading">
                Dashboard
              </Link>
            )}
            
            {/* Show Disconnected link for authenticated users without QB connection */}
            {user && !hasQbConnection && (
              <Link to="/disconnected" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-transyncpro-heading hover:border-transyncpro-heading">
                Connect QuickBooks
              </Link>
            )}
          </div>
          
          {/* Show login/signup for unauthenticated users */}
          {!user && (
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-transyncpro-button hover:bg-transyncpro-button/90 text-white">Sign up</Button>
              </Link>
            </div>
          )}
          
          {/* Show profile dropdown for authenticated users */}
          {user && (
            <div className="hidden md:flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-1 focus:outline-none">
                    <div className="h-8 w-8 rounded-full bg-transyncpro-button text-white flex items-center justify-center cursor-pointer">
                      {getUserInitials()}
                    </div>
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user?.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User size={16} className="mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  {hasQbConnection && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <User size={16} className="mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                  )}
                  {!hasQbConnection && (
                    <DropdownMenuItem onClick={() => navigate('/disconnected')}>
                      <User size={16} className="mr-2" />
                      Connect QuickBooks
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
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
          {user && hasQbConnection && (
            <Link to="/dashboard" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">
              Dashboard
            </Link>
          )}
          
          {/* Show Disconnected link for authenticated users without QB connection */}
          {user && !hasQbConnection && (
            <Link to="/disconnected" className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300">
              Connect QuickBooks
            </Link>
          )}
          
          {/* Show login/signup for unauthenticated users */}
          {!user ? (
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
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
