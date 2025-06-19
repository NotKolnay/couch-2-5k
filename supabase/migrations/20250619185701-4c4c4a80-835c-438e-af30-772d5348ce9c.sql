
-- Create users table for social features (no auth required)
CREATE TABLE public.social_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '🏃',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_workouts INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  total_distance DECIMAL DEFAULT 0,
  last_workout_date DATE
);

-- Create plans table to store user's running plans
CREATE TABLE public.social_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.social_users(id) ON DELETE CASCADE,
  plan_data JSONB NOT NULL,
  progress JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create friends table for bidirectional friendships
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.social_users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES public.social_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Create reactions table for pokes and congratulations
CREATE TABLE public.reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES public.social_users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES public.social_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('poke', 'congrats')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.social_users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('poke', 'congrats', 'milestone', 'friend_added')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.social_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team memberships table
CREATE TABLE public.team_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.social_users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.social_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access (no auth required)
CREATE POLICY "Allow public read access to social_users" ON public.social_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert to social_users" ON public.social_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to social_users" ON public.social_users FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to social_plans" ON public.social_plans FOR SELECT USING (true);
CREATE POLICY "Allow public insert to social_plans" ON public.social_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to social_plans" ON public.social_plans FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to friendships" ON public.friendships FOR SELECT USING (true);
CREATE POLICY "Allow public insert to friendships" ON public.friendships FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete to friendships" ON public.friendships FOR DELETE USING (true);

CREATE POLICY "Allow public read access to reactions" ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to reactions" ON public.reactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert to notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to notifications" ON public.notifications FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Allow public insert to teams" ON public.teams FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to team_memberships" ON public.team_memberships FOR SELECT USING (true);
CREATE POLICY "Allow public insert to team_memberships" ON public.team_memberships FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete to team_memberships" ON public.team_memberships FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_social_users_share_code ON public.social_users(share_code);
CREATE INDEX idx_social_plans_user_id ON public.social_plans(user_id);
CREATE INDEX idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX idx_reactions_to_user_date ON public.reactions(to_user_id, date);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_teams_team_code ON public.teams(team_code);

-- Function to generate short codes
CREATE OR REPLACE FUNCTION generate_short_code(length INTEGER DEFAULT 6)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create bidirectional friendship
CREATE OR REPLACE FUNCTION create_friendship(user1_id UUID, user2_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert friendship from user1 to user2
  INSERT INTO public.friendships (user_id, friend_id)
  VALUES (user1_id, user2_id)
  ON CONFLICT DO NOTHING;
  
  -- Insert friendship from user2 to user1
  INSERT INTO public.friendships (user_id, friend_id)
  VALUES (user2_id, user1_id)
  ON CONFLICT DO NOTHING;
  
  -- Create notifications for both users
  INSERT INTO public.notifications (user_id, message, type)
  VALUES 
    (user2_id, 'Someone added you as a friend!', 'friend_added'),
    (user1_id, 'Friend added successfully!', 'friend_added');
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_users;
