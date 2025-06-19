
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Share2 } from 'lucide-react';
import { useSocial } from '@/contexts/SocialContext';

const SocialSetup: React.FC = () => {
  const [name, setName] = useState('');
  const { createSocialUser, isLoading } = useSocial();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      await createSocialUser(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Join Social Running
          </CardTitle>
          <p className="text-gray-600">
            Connect with friends and share your running journey
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <>Creating your profile...</>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Create Social Profile
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">What you'll get:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• A unique share code to connect with friends</li>
              <li>• View and celebrate friends' progress</li>
              <li>• Send pokes and congratulations</li>
              <li>• Join team challenges</li>
              <li>• Track milestones together</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialSetup;
