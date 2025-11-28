import { Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';

interface User {
  fullName: string;
  email: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

export function DashboardHeader() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found in localStorage');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.log('Profile API failed, using localStorage data');
        const localUser = localStorage.getItem('user');
        if (localUser) {
          setUser(JSON.parse(localUser));
        }
      }
    } catch (error) {
      console.log('Network error fetching profile, using localStorage data');
      const localUser = localStorage.getItem('user');
      if (localUser) {
        setUser(JSON.parse(localUser));
      }
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        <div className="lg:ml-0 ml-12">
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-accent"
          >
            <Bell size={20} className="text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-foreground text-sm font-medium">
                {user?.fullName || 'User'}
              </p>
              <p className="text-muted-foreground text-xs">
                {user?.email || ''}
              </p>
            </div>
            <Avatar className="w-10 h-10 border-2 border-primary/10">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-white font-semibold">
                {getInitials(user?.fullName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}