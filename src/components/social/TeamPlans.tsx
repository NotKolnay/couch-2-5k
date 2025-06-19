
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, UserPlus, ExternalLink, Trophy, Calendar } from 'lucide-react';
import { useSocial } from '@/contexts/SocialContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  description: string;
  team_code: string;
  created_by: string;
  created_at: string;
  member_count?: number;
}

interface TeamMember {
  id: string;
  name: string;
  avatar_emoji: string;
  total_workouts: number;
  current_streak: number;
  total_distance: number;
}

const TeamPlans: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ [teamId: string]: TeamMember[] }>({});
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [joinTeamCode, setJoinTeamCode] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useSocial();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      loadUserTeams();
    }
  }, [currentUser]);

  const generateTeamCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const loadUserTeams = async () => {
    if (!currentUser) return;

    try {
      // Get teams where user is a member
      const { data: memberships, error: membershipError } = await supabase
        .from('team_memberships')
        .select(`
          team_id,
          teams (*)
        `)
        .eq('user_id', currentUser.id);

      if (membershipError) throw membershipError;

      const userTeams = memberships?.map(m => m.teams).filter(Boolean) || [];
      setTeams(userTeams);

      // Load members for each team
      for (const team of userTeams) {
        if (team) {
          await loadTeamMembers(team.id);
        }
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_memberships')
        .select(`
          social_users (*)
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      const members = data?.map(m => m.social_users).filter(Boolean) || [];
      setTeamMembers(prev => ({
        ...prev,
        [teamId]: members
      }));
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const createTeam = async () => {
    if (!currentUser || !newTeamName.trim()) return;

    setLoading(true);
    try {
      const teamCode = generateTeamCode();
      
      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: newTeamName.trim(),
          description: newTeamDescription.trim(),
          team_code: teamCode,
          created_by: currentUser.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as member
      const { error: membershipError } = await supabase
        .from('team_memberships')
        .insert({
          team_id: team.id,
          user_id: currentUser.id
        });

      if (membershipError) throw membershipError;

      toast({
        title: "Team created!",
        description: `Team "${newTeamName}" created with code ${teamCode}`,
      });

      setNewTeamName('');
      setNewTeamDescription('');
      setShowCreateTeam(false);
      loadUserTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const joinTeam = async () => {
    if (!currentUser || !joinTeamCode.trim()) return;

    setLoading(true);
    try {
      // Find team by code
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('team_code', joinTeamCode.toUpperCase())
        .single();

      if (teamError || !team) {
        toast({
          title: "Team not found",
          description: "No team found with that code.",
          variant: "destructive"
        });
        return;
      }

      // Check if already a member
      const { data: existingMembership } = await supabase
        .from('team_memberships')
        .select('*')
        .eq('team_id', team.id)
        .eq('user_id', currentUser.id)
        .single();

      if (existingMembership) {
        toast({
          title: "Already a member",
          description: "You are already a member of this team.",
          variant: "destructive"
        });
        return;
      }

      // Join team
      const { error: membershipError } = await supabase
        .from('team_memberships')
        .insert({
          team_id: team.id,
          user_id: currentUser.id
        });

      if (membershipError) throw membershipError;

      toast({
        title: "Joined team!",
        description: `Welcome to team "${team.name}"!`,
      });

      setJoinTeamCode('');
      setShowJoinTeam(false);
      loadUserTeams();
    } catch (error) {
      console.error('Error joining team:', error);
      toast({
        title: "Error",
        description: "Failed to join team. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTeamStats = (teamId: string) => {
    const members = teamMembers[teamId] || [];
    return {
      totalMembers: members.length,
      totalWorkouts: members.reduce((sum, member) => sum + (member.total_workouts || 0), 0),
      averageStreak: members.length > 0 ? 
        Math.round(members.reduce((sum, member) => sum + (member.current_streak || 0), 0) / members.length) : 0,
      totalDistance: members.reduce((sum, member) => sum + Number(member.total_distance || 0), 0)
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Team Plans</h2>
        <div className="flex gap-2">
          <Dialog open={showJoinTeam} onOpenChange={setShowJoinTeam}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Join Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="teamCode">Team Code</Label>
                  <Input
                    id="teamCode"
                    placeholder="Enter 6-character team code"
                    value={joinTeamCode}
                    onChange={(e) => setJoinTeamCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="uppercase"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowJoinTeam(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={joinTeam} disabled={!joinTeamCode.trim()} className="flex-1">
                    Join Team
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    placeholder="Enter team name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="teamDescription">Description (Optional)</Label>
                  <Input
                    id="teamDescription"
                    placeholder="Brief description of your team"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowCreateTeam(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={createTeam} disabled={!newTeamName.trim()} className="flex-1">
                    Create Team
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Teams list */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams yet</h3>
            <p className="text-gray-600 mb-4">
              Create a team or join one using a team code to start training together!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const stats = getTeamStats(team.id);
            const members = teamMembers[team.id] || [];

            return (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        {team.name}
                      </CardTitle>
                      {team.description && (
                        <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      Code: {team.team_code}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Team Stats */}
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{stats.totalMembers}</div>
                      <div className="text-xs text-gray-600">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{stats.totalWorkouts}</div>
                      <div className="text-xs text-gray-600">Total Workouts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">{stats.averageStreak}</div>
                      <div className="text-xs text-gray-600">Avg Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{stats.totalDistance.toFixed(1)}K</div>
                      <div className="text-xs text-gray-600">Total Distance</div>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div>
                    <h4 className="font-medium mb-3">Team Members</h4>
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 bg-white border rounded-md">
                          <div className="flex items-center space-x-3">
                            <div className="text-lg">{member.avatar_emoji}</div>
                            <div>
                              <div className="font-medium">
                                {member.name}
                                {member.id === currentUser?.id && (
                                  <span className="text-blue-600 text-xs ml-2">(You)</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600">
                                {member.total_workouts} workouts • {member.current_streak} day streak
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`/plan/${member.id}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeamPlans;
