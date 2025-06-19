
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Zap, Heart, Trophy, Users } from 'lucide-react';
import { useSocial } from '@/contexts/SocialContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationsList: React.FC = () => {
  const { notifications, markNotificationRead } = useSocial();

  const getIcon = (type: string) => {
    switch (type) {
      case 'poke': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'congrats': return <Heart className="w-4 h-4 text-red-500" />;
      case 'milestone': return <Trophy className="w-4 h-4 text-purple-500" />;
      case 'friend_added': return <Users className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-600">
            You'll see pokes, congratulations, and milestone celebrations here!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start justify-between p-3 rounded-lg border ${
              notification.read 
                ? 'bg-gray-50 border-gray-200' 
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              {getIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!notification.read && (
                <>
                  <Badge variant="secondary" className="text-xs">New</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markNotificationRead(notification.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default NotificationsList;
