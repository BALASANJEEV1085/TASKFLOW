import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FormInput } from '../components/FormInput';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { User, Mail, Lock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface UserData {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [profileData, setProfileData] = useState({ fullName: '', email: '' });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
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
        setProfileData({
          fullName: userData.fullName,
          email: userData.email
        });
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Network error. Please try again.');
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileData.fullName.trim()) {
      toast.error('Name is required');
      return;
    }

    if (profileData.fullName.trim().length < 2) {
      toast.error('Name must be at least 2 characters long');
      return;
    }

    setProfileLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileData.fullName.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        // Update localStorage with new user data
        localStorage.setItem('user', JSON.stringify(data.user));
        toast.success('Profile updated successfully');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    setPasswordValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'newPassword') {
      validatePassword(value);
    }
    
    // Clear errors when user types
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};

    if (!passwordData.oldPassword.trim()) {
      errors.oldPassword = 'Current password is required';
    }

    if (!passwordData.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else {
      if (!passwordValidation.length) {
        errors.newPassword = 'Password must be at least 8 characters';
      }
      if (!passwordValidation.uppercase) {
        errors.newPassword = 'Password must contain at least one uppercase letter';
      }
      if (!passwordValidation.lowercase) {
        errors.newPassword = 'Password must contain at least one lowercase letter';
      }
      if (!passwordValidation.number) {
        errors.newPassword = 'Password must contain at least one number';
      }
    }

    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);

    if (Object.keys(errors).length === 0) {
      setPasswordLoading(true);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please login again');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/change-password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            oldPassword: passwordData.oldPassword,
            newPassword: passwordData.newPassword,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('Password changed successfully');
          // Reset form
          setPasswordData({
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          setPasswordValidation({
            length: false,
            uppercase: false,
            lowercase: false,
            number: false,
          });
          setPasswordErrors({});
        } else {
          toast.error(data.message || 'Failed to change password');
        }
      } catch (error) {
        console.error('Error changing password:', error);
        toast.error('Network error. Please try again.');
      } finally {
        setPasswordLoading(false);
      }
    }
  };

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <CheckCircle size={16} className="text-green-500" />
      ) : (
        <XCircle size={16} className="text-gray-400" />
      )}
      <span className={met ? 'text-green-600' : 'text-gray-500'}>{text}</span>
    </div>
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size={48} />
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information and security</p>
      </div>

      {/* Profile Info Card */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
            <Avatar className="w-16 h-16">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-white text-lg font-semibold">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold mb-1">{user.fullName}</h3>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Full Name"
                name="fullName"
                icon={<User size={18} />}
                placeholder="John Doe"
                value={profileData.fullName}
                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                disabled={profileLoading}
                required
              />

              <FormInput
                label="Email Address"
                name="email"
                type="email"
                icon={<Mail size={18} />}
                placeholder="john@example.com"
                value={profileData.email}
                disabled={true}
                helperText="Email address cannot be changed"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                className="gap-2 min-w-32"
                disabled={profileLoading || profileData.fullName === user.fullName}
              >
                {profileLoading ? (
                  <>
                    <LoadingSpinner size={16} />
                    Updating...
                  </>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock size={20} />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <FormInput
              label="Current Password"
              name="oldPassword"
              type="password"
              icon={<Lock size={18} />}
              placeholder="Enter your current password"
              value={passwordData.oldPassword}
              onChange={handlePasswordChange}
              error={passwordErrors.oldPassword}
              disabled={passwordLoading}
              required
            />

            <FormInput
              label="New Password"
              name="newPassword"
              type="password"
              icon={<Lock size={18} />}
              placeholder="Enter your new password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              error={passwordErrors.newPassword}
              disabled={passwordLoading}
              required
            />

            {/* Password Requirements */}
            {passwordData.newPassword && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                <PasswordRequirement
                  met={passwordValidation.length}
                  text="At least 8 characters long"
                />
                <PasswordRequirement
                  met={passwordValidation.uppercase}
                  text="Contains uppercase letter"
                />
                <PasswordRequirement
                  met={passwordValidation.lowercase}
                  text="Contains lowercase letter"
                />
                <PasswordRequirement
                  met={passwordValidation.number}
                  text="Contains number"
                />
              </div>
            )}

            <FormInput
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              icon={<Lock size={18} />}
              placeholder="Confirm your new password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              error={passwordErrors.confirmPassword}
              disabled={passwordLoading}
              required
            />

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                className="gap-2 min-w-40"
                disabled={passwordLoading || 
                  !passwordData.oldPassword || 
                  !passwordData.newPassword || 
                  !passwordData.confirmPassword ||
                  !passwordValidation.length ||
                  !passwordValidation.uppercase ||
                  !passwordValidation.lowercase ||
                  !passwordValidation.number ||
                  passwordData.newPassword !== passwordData.confirmPassword
                }
                variant="default"
              >
                {passwordLoading ? (
                  <>
                    <LoadingSpinner size={16} />
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Security Note */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock size={12} className="text-blue-600" />
            </div>
            <div>
              <h4 className="text-blue-800 font-medium mb-1">Security Tips</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Use a strong, unique password that you don't use elsewhere</li>
                <li>• Avoid using personal information in your password</li>
                <li>• Consider using a password manager</li>
                <li>• Never share your password with anyone</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}