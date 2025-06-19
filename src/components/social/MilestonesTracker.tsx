
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Share2, Star, Calendar, Target, Zap } from 'lucide-react';
import { useSocial } from '@/contexts/SocialContext';
import { useToast } from '@/hooks/use-toast';

interface Milestone {
  id: string;
  title: string;
  description: string;
  type: 'workouts' | 'streak' | 'distance' | 'weekly';
  threshold: number;
  emoji: string;
  achieved: boolean;
  achievedAt?: string;
}

const MilestonesTracker: React.FC = () => {
  const { currentUser } = useSocial();
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Define milestone templates
  const milestoneTemplates: Omit<Milestone, 'id' | 'achieved' | 'achievedAt'>[] = [
    { title: "First Steps", description: "Complete your first workout", type: "workouts", threshold: 1, emoji: "🎯" },
    { title: "Getting Started", description: "Complete 5 workouts", type: "workouts", threshold: 5, emoji: "🏃" },
    { title: "Committed Runner", description: "Complete 10 workouts", type: "workouts", threshold: 10, emoji: "💪" },
    { title: "Seasoned Athlete", description: "Complete 20 workouts", type: "workouts", threshold: 20, emoji: "🏆" },
    { title: "Marathon Mindset", description: "Complete 50 workouts", type: "workouts", threshold: 50, emoji: "👑" },
    
    { title: "Day Two", description: "Maintain a 2-day streak", type: "streak", threshold: 2, emoji: "🔥" },
    { title: "Week Warrior", description: "Maintain a 7-day streak", type: "streak", threshold: 7, emoji: "⚡" },
    { title: "Streak Master", description: "Maintain a 14-day streak", type: "streak", threshold: 14, emoji: "🌟" },
    { title: "Unstoppable", description: "Maintain a 30-day streak", type: "streak", threshold: 30, emoji: "🚀" },
    
    { title: "First Kilometer", description: "Run your first 1km total", type: "distance", threshold: 1, emoji: "🎖️" },
    { title: "5K Club", description: "Run 5km total distance", type: "distance", threshold: 5, emoji: "🥉" },
    { title: "10K Hero", description: "Run 10km total distance", type: "distance", threshold: 10, emoji: "🥈" },
    { title: "Half Marathon", description: "Run 21km total distance", type: "distance", threshold: 21, emoji: "🥇" },
    { title: "Marathon Champion", description: "Run 42km total distance", type: "distance", threshold: 42, emoji: "🏅" }
  ];

  useEffect(() => {
    if (currentUser) {
      checkMilestones();
    }
  }, [currentUser]);

  const checkMilestones = () => {
    if (!currentUser) return;

    const updatedMilestones = milestoneTemplates.map(template => {
      let achieved = false;
      
      switch (template.type) {
        case 'workouts':
          achieved = (currentUser.total_workouts || 0) >= template.threshold;
          break;
        case 'streak':
          achieved = (currentUser.current_streak || 0) >= template.threshold;
          break;
        case 'distance':
          achieved = Number(currentUser.total_distance || 0) >= template.threshold;
          break;
      }

      return {
        ...template,
        id: `${template.type}-${template.threshold}`,
        achieved,
        achievedAt: achieved ? new Date().toISOString() : undefined
      };
    });

    setMilestones(updatedMilestones);
  };

  const shareMilestone = async (milestone: Milestone) => {
    const shareText = `🎉 I just achieved "${milestone.title}" on my running journey! ${milestone.emoji}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Running Milestone Achieved!',
          text: shareText,
          url: currentUser ? `${window.location.origin}/plan/${currentUser.share_code}` : window.location.href
        });
      } catch (error) {
        console.log('Sharing cancelled');
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard!",
        description: "Share your milestone achievement with friends!",
      });
    }
  };

  const achievedMilestones = milestones.filter(m => m.achieved);
  const upcomingMilestones = milestones.filter(m => !m.achieved).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Achieved Milestones */}
      {achievedMilestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Achievements ({achievedMilestones.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievedMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{milestone.emoji}</div>
                  <div>
                    <h4 className="font-semibold text-green-800">{milestone.title}</h4>
                    <p className="text-sm text-green-600">{milestone.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    ✓ Achieved
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareMilestone(milestone)}
                    className="h-8"
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Next Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingMilestones.length > 0 ? (
            upcomingMilestones.map((milestone) => {
              let progress = 0;
              let current = 0;
              
              switch (milestone.type) {
                case 'workouts':
                  current = currentUser?.total_workouts || 0;
                  progress = Math.min((current / milestone.threshold) * 100, 100);
                  break;
                case 'streak':
                  current = currentUser?.current_streak || 0;
                  progress = Math.min((current / milestone.threshold) * 100, 100);
                  break;
                case 'distance':
                  current = Number(currentUser?.total_distance || 0);
                  progress = Math.min((current / milestone.threshold) * 100, 100);
                  break;
              }

              return (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl opacity-60">{milestone.emoji}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-800">{milestone.title}</h4>
                      <p className="text-sm text-blue-600">{milestone.description}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                          <span>Progress: {current} / {milestone.threshold}</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-600 py-4">
              🎉 Congratulations! You've achieved all available milestones!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MilestonesTracker;
