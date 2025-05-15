
import { useNavigate } from "react-router-dom";
import { User, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface UserMenuProps {
  user: SupabaseUser | null;
  hasQbConnection: boolean;
  signOut: () => Promise<void>;
}

const UserMenu = ({ user, hasQbConnection, signOut }: UserMenuProps) => {
  const navigate = useNavigate();

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

  return (
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
          <DropdownMenuItem onClick={signOut}>
            <LogOut size={16} className="mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserMenu;
