
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Heart, ExternalLink } from 'lucide-react';
import { useSocial } from '@/contexts/SocialContext';

const FriendsList: React.FC = () => {
  const { friends, sendPoke, sendCongrats } = useSocial();

  if (friends.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-400 mb-4 text-4xl">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No friends yet</h3>
          <p className="text-gray-600">
            Add friends using their share codes to start connecting!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {friends.map((friend) => (
        <Card key={friend.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{friend.avatar_emoji}</div>
                <div>
                  <h4 className="font-semibold">{friend.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{friend.total_workouts} workouts</span>
                    <span>{friend.current_streak} day streak</span>
                    <Badge variant="secondary" className="text-xs">
                      {friend.share_code}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sendPoke(friend.id)}
                  className="hover:bg-yellow-50 hover:border-yellow-300"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Poke
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sendCongrats(friend.id)}
                  className="hover:bg-red-50 hover:border-red-300"
                >
                  <Heart className="w-4 h-4 mr-1" />
                  Congrats
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(`/plan/${friend.share_code}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FriendsList;
