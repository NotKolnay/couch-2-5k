
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';
import { useSocial } from '@/contexts/SocialContext';

interface AddFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddFriendDialog: React.FC<AddFriendDialogProps> = ({ open, onOpenChange }) => {
  const [friendCode, setFriendCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addFriend } = useSocial();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendCode.trim()) return;

    setIsLoading(true);
    try {
      await addFriend(friendCode.trim());
      setFriendCode('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding friend:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Friend
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="friendCode">Friend's Share Code</Label>
            <Input
              id="friendCode"
              type="text"
              placeholder="Enter 6-character code (e.g., AB1234)"
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="mt-1 uppercase"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Ask your friend for their share code to connect!
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !friendCode.trim()}
              className="flex-1"
            >
              {isLoading ? 'Adding...' : 'Add Friend'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendDialog;
