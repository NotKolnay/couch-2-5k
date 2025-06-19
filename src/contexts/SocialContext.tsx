
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SocialUser {
  id: string;
  share_code: string;
  name: string;
  avatar_emoji: string;
  total_workouts: number;
  current_streak: number;
  total_distance: number;
  created_at: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'poke' | 'congrats' | 'milestone' | 'friend_added';
  read: boolean;
  created_at: string;
}

interface SocialContextType {
  currentUser: SocialUser | null;
  notifications: Notification[];
  friends: SocialUser[];
  createSocialUser: (name: string) => Promise<void>;
  loadUserByCode: (shareCode: string) => Promise<SocialUser | null>;
  addFriend: (friendCode: string) => Promise<void>;
  sendPoke: (friendId: string) => Promise<void>;
  sendCongrats: (friendId: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  updateUserProgress: (workoutData: any) => Promise<void>;
  isLoading: boolean;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) {
    throw new Error('useSocial must be used within a SocialProvider');
  }
  return context;
};

export const SocialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<SocialUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Generate share code
  const generateShareCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Load user from localStorage
  useEffect(() => {
    const savedUserId = localStorage.getItem('social-user-id');
    if (savedUserId) {
      loadCurrentUser(savedUserId);
    }
  }, []);

  // Set up real-time notifications
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          // Show toast for new notifications
          toast({
            title: "New notification",
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, toast]);

  const loadCurrentUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('social_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setCurrentUser(data);
      loadNotifications(userId);
      loadFriends(userId);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadFriends = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          friend_id,
          social_users!friendships_friend_id_fkey (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      const friendsData = data?.map(f => f.social_users).filter(Boolean) || [];
      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const createSocialUser = async (name: string) => {
    setIsLoading(true);
    try {
      const shareCode = generateShareCode();
      
      const { data, error } = await supabase
        .from('social_users')
        .insert({
          name,
          share_code: shareCode,
          avatar_emoji: '🏃'
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentUser(data);
      localStorage.setItem('social-user-id', data.id);
      
      toast({
        title: "Welcome to Social Running!",
        description: `Your share code is ${shareCode}. Share it with friends!`,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create social profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserByCode = async (shareCode: string): Promise<SocialUser | null> => {
    try {
      const { data, error } = await supabase
        .from('social_users')
        .select('*')
        .eq('share_code', shareCode.toUpperCase())
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error loading user by code:', error);
      return null;
    }
  };

  const addFriend = async (friendCode: string) => {
    if (!currentUser) return;

    try {
      const friend = await loadUserByCode(friendCode);
      if (!friend) {
        toast({
          title: "User not found",
          description: "No user found with that share code.",
          variant: "destructive"
        });
        return;
      }

      if (friend.id === currentUser.id) {
        toast({
          title: "Cannot add yourself",
          description: "You cannot add yourself as a friend.",
          variant: "destructive"
        });
        return;
      }

      // Use the database function to create bidirectional friendship
      const { error } = await supabase.rpc('create_friendship', {
        user1_id: currentUser.id,
        user2_id: friend.id
      });

      if (error) throw error;

      // Reload friends list
      loadFriends(currentUser.id);
      
      toast({
        title: "Friend added!",
        description: `${friend.name} has been added to your friends list.`,
      });
    } catch (error) {
      console.error('Error adding friend:', error);
      toast({
        title: "Error",
        description: "Failed to add friend. Please try again.",
        variant: "destructive"
      });
    }
  };

  const sendPoke = async (friendId: string) => {
    if (!currentUser) return;

    try {
      // Check if already poked today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingPoke } = await supabase
        .from('reactions')
        .select('*')
        .eq('from_user_id', currentUser.id)
        .eq('to_user_id', friendId)
        .eq('type', 'poke')
        .eq('date', today)
        .single();

      if (existingPoke) {
        toast({
          title: "Already poked today!",
          description: "You can only poke each friend once per day.",
          variant: "destructive"
        });
        return;
      }

      // Send poke
      const { error } = await supabase
        .from('reactions')
        .insert({
          from_user_id: currentUser.id,
          to_user_id: friendId,
          type: 'poke'
        });

      if (error) throw error;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: friendId,
          message: `${currentUser.name} poked you to run today! 👟`,
          type: 'poke'
        });

      toast({
        title: "Poke sent!",
        description: "Your friend has been poked to run today!",
      });
    } catch (error) {
      console.error('Error sending poke:', error);
      toast({
        title: "Error",
        description: "Failed to send poke. Please try again.",
        variant: "destructive"
      });
    }
  };

  const sendCongrats = async (friendId: string) => {
    if (!currentUser) return;

    try {
      // Send congratulations
      const { error } = await supabase
        .from('reactions')
        .insert({
          from_user_id: currentUser.id,
          to_user_id: friendId,
          type: 'congrats'
        });

      if (error) throw error;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: friendId,
          message: `${currentUser.name} congratulated you! 👏`,
          type: 'congrats'
        });

      toast({
        title: "Congratulations sent!",
        description: "Your friend has been congratulated!",
      });
    } catch (error) {
      console.error('Error sending congrats:', error);
      toast({
        title: "Error",
        description: "Failed to send congratulations. Please try again.",
        variant: "destructive"
      });
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const updateUserProgress = async (workoutData: any) => {
    if (!currentUser) return;

    try {
      // Update user stats
      const { error } = await supabase
        .from('social_users')
        .update({
          total_workouts: currentUser.total_workouts + 1,
          current_streak: currentUser.current_streak + 1,
          total_distance: Number(currentUser.total_distance) + (workoutData.distance || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Reload current user
      loadCurrentUser(currentUser.id);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  return (
    <SocialContext.Provider value={{
      currentUser,
      notifications,
      friends,
      createSocialUser,
      loadUserByCode,
      addFriend,
      sendPoke,
      sendCongrats,
      markNotificationRead,
      updateUserProgress,
      isLoading
    }}>
      {children}
    </SocialContext.Provider>
  );
};
