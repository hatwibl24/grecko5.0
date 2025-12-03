
import React, { useState, useEffect } from 'react';
import { LogOut, Sparkles, Lock, Mail, AlertTriangle, Trash2, Shield } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { User as UserType } from '../types';
import { invokeEdgeFunction } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface ProfileProps {
  user: UserType;
  onLogout: () => void;
  onUpdateUser: (data: Partial<UserType>) => Promise<void>;
}

export const Profile: React.FC<ProfileProps> = ({ user, onLogout, onUpdateUser }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({ 
    name: user.name, 
    school: user.school || '', 
    bio: user.bio || '', 
    grade: user.grade || '' 
  });
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Security State
  const [newEmail, setNewEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Sync state when user prop updates (e.g. after refreshProfile)
  useEffect(() => {
    setFormData({
      name: user.name,
      school: user.school || '',
      bio: user.bio || '',
      grade: user.grade || ''
    });
    setAvatarPreview(user.avatar);
    setNewEmail(user.email);
  }, [user]);

  const handleGenerateAvatar = async () => {
    setIsGeneratingAvatar(true);
    try {
        const data = await invokeEdgeFunction('ai-assistant', { 
            type: 'avatar', 
            prompt: `Student named ${formData.name}` 
        });
        
        const imageUrl = data.url;
        setAvatarPreview(imageUrl);
        
        await onUpdateUser({ avatar: imageUrl });
        addToast("New avatar generated and saved!", "success");
    } catch (error) { 
        console.error("Avatar error:", error); 
        addToast("Failed to generate avatar. Try again.", "error");
    } finally { 
        setIsGeneratingAvatar(false); 
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await onUpdateUser({ ...formData, avatar: avatarPreview });
      addToast("Profile saved successfully!", "success");
    } catch (e: any) {
      console.error(e);
      addToast("Failed to save profile: " + e.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || newEmail === user.email) return;
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      addToast("Confirmation link sent to new email. Check your inbox.", "success");
    } catch (e: any) {
      addToast(e.message, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) return;
    if (newPassword !== confirmNewPassword) {
      addToast("Passwords do not match", "warning");
      return;
    }
    if (newPassword.length < 6) {
      addToast("Password must be at least 6 characters", "warning");
      return;
    }

    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      addToast("Password updated successfully", "success");
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (e: any) {
      addToast(e.message, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmed) return;
    
    const doubleConfirmed = window.prompt("Type 'DELETE' to confirm account deletion.");
    if (doubleConfirmed !== 'DELETE') return;

    setAuthLoading(true);
    try {
        // Attempt to call RPC function if it exists, otherwise alert user
        const { error } = await supabase.rpc('delete_user'); 
        if (error) {
            console.error("Deletion failed", error);
            // Fallback: If no backend function, user must contact admin
            addToast("Could not auto-delete. Please contact support to complete deletion.", "error");
        } else {
           await onLogout();
        }
    } catch (e: any) {
        console.error(e);
        addToast("Failed to delete account: " + e.message, "error");
    } finally {
        setAuthLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
          <p className="text-slate-500 text-sm">Manage your profile and account security</p>
        </div>
      </div>

      <Card className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-4 mb-4">
             <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
               <Sparkles className="w-5 h-5" />
             </div>
             <h3 className="font-bold text-lg text-slate-900 dark:text-white">Personal Details</h3>
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="relative group shrink-0">
               <img 
                 src={avatarPreview || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                 alt="Avatar" 
                 className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 dark:border-zinc-700 bg-slate-100" 
               />
               <button 
                 onClick={handleGenerateAvatar} 
                 disabled={isGeneratingAvatar} 
                 className={`absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full shadow-md text-white hover:bg-blue-700 transition-all ${isGeneratingAvatar ? 'animate-spin' : ''}`}
                 title="Generate AI Avatar"
               >
                 <Sparkles className="w-4 h-4" />
               </button>
            </div>
            <div className="space-y-3 flex-1 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="Full Name" name="name" value={formData.name} onChange={handleInputChange} />
                <Input label="School" name="school" value={formData.school} onChange={handleInputChange} />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Grade Level</label>
                 <select 
                    name="grade" 
                    value={formData.grade} 
                    onChange={handleInputChange} 
                    className="block w-full rounded-xl border-slate-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-3 px-4 border"
                 >
                    <option value="">Select Grade</option>
                    <option value="Freshman">Freshman</option>
                    <option value="Sophomore">Sophomore</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Graduate">Graduate</option>
                 </select>
              </div>
            </div>
          </div>
          <div className="w-full space-y-1.5">
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Bio</label>
               <textarea 
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about your academic goals..."
                  className="block w-full rounded-xl border-slate-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 text-slate-900 dark:text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-3 px-4 border min-h-[100px]"
               />
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-zinc-800 mt-4">
            <Button onClick={handleSaveProfile} disabled={isGeneratingAvatar || isSaving} isLoading={isSaving}>
                {isGeneratingAvatar ? 'Generating...' : 'Save Changes'}
            </Button>
          </div>
      </Card>

      {/* Account Security Card */}
      <Card className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-4 mb-4">
             <div className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-lg text-slate-600 dark:text-slate-400">
               <Shield className="w-5 h-5" />
             </div>
             <h3 className="font-bold text-lg text-slate-900 dark:text-white">Account Security</h3>
          </div>

          <div className="space-y-6">
             {/* Change Email */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                   <Input 
                      label="Email Address" 
                      value={newEmail} 
                      onChange={(e) => setNewEmail(e.target.value)} 
                      icon={<Mail className="w-4 h-4" />}
                   />
                </div>
                <Button 
                   onClick={handleUpdateEmail} 
                   variant="secondary" 
                   disabled={authLoading || newEmail === user.email}
                   isLoading={authLoading}
                >
                   Update Email
                </Button>
             </div>

             <div className="border-t border-slate-100 dark:border-zinc-800" />

             {/* Change Password */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                   type="password"
                   label="New Password" 
                   value={newPassword} 
                   onChange={(e) => setNewPassword(e.target.value)} 
                   placeholder="••••••••"
                   icon={<Lock className="w-4 h-4" />}
                />
                <Input 
                   type="password"
                   label="Confirm Password" 
                   value={confirmNewPassword} 
                   onChange={(e) => setConfirmNewPassword(e.target.value)} 
                   placeholder="••••••••"
                   icon={<Lock className="w-4 h-4" />}
                />
             </div>
             <div className="flex justify-end">
                <Button 
                   onClick={handleUpdatePassword} 
                   variant="secondary"
                   disabled={authLoading || !newPassword}
                   isLoading={authLoading}
                >
                   Update Password
                </Button>
             </div>

             <div className="border-t border-slate-100 dark:border-zinc-800" />

             {/* Danger Zone */}
             <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                   <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-500 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                   </div>
                   <div>
                      <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">Delete Account</h4>
                      <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-1">
                         Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                   </div>
                </div>
                <Button 
                   variant="danger" 
                   onClick={handleDeleteAccount}
                   isLoading={authLoading}
                   className="shrink-0"
                   icon={<Trash2 className="w-4 h-4" />}
                >
                   Delete Account
                </Button>
             </div>
          </div>
      </Card>
      
      <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
        <Button variant="outline" onClick={onLogout} className="flex items-center gap-2 text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20">
            <LogOut className="w-4 h-4" /> Log Out
        </Button>
      </div>
    </div>
  );
};
