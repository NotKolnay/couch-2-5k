import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Share2, Heart, ExternalLink, Calendar, Trophy, Users2, Target } from 'lucide-react';
import { useSocial } from '@/contexts/SocialContext';
import { supabase } from '@/integrations/supabase/client';

const PublicPlanView: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [planUser, setPlanUser] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [userTeams, setUserTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, sendCongrats } = useSocial();

  useEffect(() => {
    if (shareCode) {
      loadPublicPlan(shareCode);
    }
  }, [shareCode]);

  const loadPublicPlan = async (code: string) => {
    try {
      // Load user by share code
      const { data: userData, error: userError } = await supabase
        .from('social_users')
        .select('*')
        .eq('share_code', code.toUpperCase())
        .single();

      if (userError) throw userError;
      setPlanUser(userData);

      // Load their plan data
      const { data: planData, error: planError } = await supabase
        .from('social_plans')
        .select('*')
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (planError && planError.code !== 'PGRST116') {
        throw planError;
      }

      setPlanData(planData);

      // Load user's teams
      const { data: teamMemberships, error: teamError } = await supabase
        .from('team_memberships')
        .select(`
          teams (
            id,
            name,
            team_code,
            description
          )
        `)
        .eq('user_id', userData.id);

      if (!teamError && teamMemberships) {
        setUserTeams(teamMemberships.map(m => m.teams).filter(Boolean));
      }
    } catch (error) {
      console.error('Error loading public plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading plan...</p>
        </div>
      </div>
    );
  }

  if (!planUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4 text-4xl">❓</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Plan not found</h3>
            <p className="text-gray-600">
              The plan you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="mt-4"
            >
              Go to Running Planner
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${planUser.name}'s Running Journey`,
          text: `Check out ${planUser.name}'s running progress!`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Sharing cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleCongratulate = () => {
    if (currentUser && planUser) {
      sendCongrats(planUser.id);
    }
  };

  // Calculate progress if plan data exists
  const progressPercentage = planData ? 
    Math.round((planData.progress?.filter((p: any) => p.completed).length / planData.progress?.length) * 100) || 0 
    : 0;

  // Generate achievements based on user stats
  const generateAchievements = () => {
    const achievements = [];
    
    if (planUser.total_workouts >= 1) achievements.push({ title: "First Steps", emoji: "🎯", description: "Completed first workout" });
    if (planUser.total_workouts >= 5) achievements.push({ title: "Getting Started", emoji: "🏃", description: "Completed 5 workouts" });
    if (planUser.total_workouts >= 10) achievements.push({ title: "Committed Runner", emoji: "💪", description: "Completed 10 workouts" });
    if (planUser.current_streak >= 7) achievements.push({ title: "Week Warrior", emoji: "⚡", description: "7-day streak" });
    if (planUser.current_streak >= 14) achievements.push({ title: "Streak Master", emoji: "🌟", description: "14-day streak" });
    if (Number(planUser.total_distance) >= 5) achievements.push({ title: "5K Club", emoji: "🥉", description: "5km total distance" });
    if (Number(planUser.total_distance) >= 10) achievements.push({ title: "10K Hero", emoji: "🥈", description: "10km total distance" });
    
    return achievements;
  };

  const achievements = generateAchievements();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            {planUser.name}'s Running Journey
          </h1>
          <p className="text-lg text-gray-600">Follow their progress and cheer them on!</p>
        </div>

        {/* User Profile Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-green-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{planUser.avatar_emoji}</div>
                <div>
                  <h2 className="text-2xl font-bold">{planUser.name}</h2>
                  <p className="text-blue-100">Share Code: {planUser.share_code}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleShare}
                  variant="secondary" 
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                {currentUser && currentUser.id !== planUser.id && (
                  <Button 
                    onClick={handleCongratulate}
                    variant="secondary" 
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Congratulate
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{planUser.total_workouts}</div>
                <div className="text-sm text-blue-100">Workouts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{planUser.current_streak}</div>
                <div className="text-sm text-blue-100">Day Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Number(planUser.total_distance).toFixed(1)}K</div>
                <div className="text-sm text-blue-100">Total Distance</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        {planData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Current Plan Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-gray-600">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {planData.progress?.filter((p: any) => p.completed).length || 0}
                    </div>
                    <div className="text-xs text-green-700">Completed</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">
                      {planData.progress?.filter((p: any) => p.skipped).length || 0}
                    </div>
                    <div className="text-xs text-yellow-700">Skipped</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {planData.progress?.filter((p: any) => !p.completed && !p.skipped).length || 0}
                    </div>
                    <div className="text-xs text-blue-700">Remaining</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {achievements.length}
                    </div>
                    <div className="text-xs text-purple-700">Achievements</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Achievements ({achievements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="text-2xl">{achievement.emoji}</div>
                    <div>
                      <p className="font-medium text-purple-800">{achievement.title}</p>
                      <p className="text-sm text-purple-600">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teams */}
        {userTeams.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users2 className="w-5 h-5 text-blue-500" />
                Team Memberships
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userTeams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-blue-800">{team.name}</h4>
                      {team.description && (
                        <p className="text-sm text-blue-600">{team.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {team.team_code}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        {!currentUser && (
          <Card className="text-center">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold mb-4">Start Your Own Running Journey!</h3>
              <p className="text-gray-600 mb-6">
                Join the social running community and track your progress with friends.
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicPlanView;
