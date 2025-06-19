
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSocial } from '@/contexts/SocialContext';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar_emoji: string;
  total_workouts: number;
  current_streak: number;
  total_distance: number;
  completion_percentage: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workouts' | 'streak' | 'distance'>('workouts');
  const { currentUser, friends } = useSocial();

  useEffect(() => {
    loadLeaderboard();
  }, [friends, activeTab]);

  const loadLeaderboard = async () => {
    try {
      // Get friends + current user IDs
      const userIds = friends.map(f => f.id);
      if (currentUser) {
        userIds.push(currentUser.id);
      }

      if (userIds.length === 0) {
        setLeaderboardData([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('social_users')
        .select('*')
        .in('id', userIds)
        .order(
          activeTab === 'workouts' ? 'total_workouts' :
          activeTab === 'streak' ? 'current_streak' : 
          'total_distance', 
          { ascending: false }
        );

      if (error) throw error;

      const leaderboard = data.map(user => ({
        ...user,
        completion_percentage: Math.round((user.total_workouts / Math.max(user.total_workouts, 20)) * 100)
      }));

      setLeaderboardData(leaderboard);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 1: return <Medal className="w-5 h-5 text-gray-400" />;
      case 2: return <Award className="w-5 h-5 text-orange-500" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{index + 1}</span>;
    }
  };

  const getCurrentUserRank = () => {
    if (!currentUser) return null;
    const userIndex = leaderboardData.findIndex(user => user.id === currentUser.id);
    return userIndex >= 0 ? userIndex + 1 : null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </CardContent>
      </Card>
    );
  }

  if (leaderboardData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No rankings yet</h3>
          <p className="text-gray-600">Add friends to see your competitive rankings!</p>
        </CardContent>
      </Card>
    );
  }

  const currentUserRank = getCurrentUserRank();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Friends Leaderboard
          {currentUserRank && (
            <Badge variant="secondary" className="ml-auto">
              Your rank: #{currentUserRank}
            </Badge>
          )}
        </CardTitle>
        
        {/* Tab buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('workouts')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'workouts' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Workouts
          </button>
          <button
            onClick={() => setActiveTab('streak')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'streak' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Streak
          </button>
          <button
            onClick={() => setActiveTab('distance')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'distance' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Distance
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {leaderboardData.map((user, index) => (
          <div
            key={user.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
              user.id === currentUser?.id 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {getRankIcon(index)}
              <div className="text-xl">{user.avatar_emoji}</div>
              <div>
                <h4 className="font-semibold">
                  {user.name}
                  {user.id === currentUser?.id && (
                    <span className="text-blue-600 text-xs ml-2">(You)</span>
                  )}
                </h4>
                <div className="flex items-center space-x-3 text-xs text-gray-600">
                  <span>{user.total_workouts} workouts</span>
                  <span>{user.current_streak} day streak</span>
                  <span>{Number(user.total_distance).toFixed(1)}km</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {activeTab === 'workouts' && user.total_workouts}
                {activeTab === 'streak' && user.current_streak}
                {activeTab === 'distance' && `${Number(user.total_distance).toFixed(1)}K`}
              </div>
              <div className="text-xs text-gray-500">
                {activeTab === 'workouts' && 'completed'}
                {activeTab === 'streak' && 'days'}
                {activeTab === 'distance' && 'total'}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
