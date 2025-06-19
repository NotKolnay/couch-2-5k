
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Bell, Trophy, Share2, UserPlus, Target, Users2 } from 'lucide-react';
import { useSocial } from '@/contexts/SocialContext';
import AddFriendDialog from './AddFriendDialog';
import NotificationsList from './NotificationsList';
import FriendsList from './FriendsList';
import Leaderboard from './Leaderboard';
import MilestonesTracker from './MilestonesTracker';
import TeamPlans from './TeamPlans';

const SocialDashboard: React.FC = () => {
  const { currentUser, notifications, friends } = useSocial();
  const [showAddFriend, setShowAddFriend] = useState(false);

  if (!currentUser) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleShareCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my running journey!',
          text: `Follow my running progress with code: ${currentUser.share_code}`,
          url: `${window.location.origin}/plan/${currentUser.share_code}`
        });
      } catch (error) {
        console.log('Sharing cancelled');
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/plan/${currentUser.share_code}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-green-500 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{currentUser.avatar_emoji}</div>
              <div>
                <h2 className="text-xl font-bold">{currentUser.name}</h2>
                <p className="text-blue-100">Share Code: {currentUser.share_code}</p>
              </div>
            </div>
            <Button 
              onClick={handleShareCode}
              variant="secondary" 
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{currentUser.total_workouts}</div>
              <div className="text-sm text-blue-100">Workouts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{currentUser.current_streak}</div>
              <div className="text-sm text-blue-100">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Number(currentUser.total_distance).toFixed(1)}K</div>
              <div className="text-sm text-blue-100">Total Distance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Features Tabs */}
      <Tabs defaultValue="friends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-white/70 backdrop-blur-sm">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Milestones
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Users2 className="w-4 h-4" />
            Teams
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Friends</h3>
            <Button onClick={() => setShowAddFriend(true)} size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
            </Button>
          </div>
          <FriendsList />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsList />
        </TabsContent>

        <TabsContent value="leaderboard">
          <Leaderboard />
        </TabsContent>

        <TabsContent value="milestones">
          <MilestonesTracker />
        </TabsContent>

        <TabsContent value="teams">
          <TeamPlans />
        </TabsContent>
      </Tabs>

      <AddFriendDialog 
        open={showAddFriend} 
        onOpenChange={setShowAddFriend} 
      />
    </div>
  );
};

export default SocialDashboard;
