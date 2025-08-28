import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { socketManager } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';
import { Bell, AlertTriangle } from 'lucide-react';

export function ToastNotifications() {
  const { user, isAuthenticated } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = socketManager.getSocket();
    if (!socket) return;

    // Listen for reminder notifications
    socket.on('reminder:due', (data) => {
      toast({
        title: 'Reminder',
        description: data.title,
        duration: 10000,
      });
    });

    // Listen for emergency alerts
    socket.on('emergency:alert', (data) => {
      toast({
        title: 'Emergency Alert Sent',
        description: 'Your emergency contacts have been notified.',
        variant: 'destructive',
        duration: 10000,
      });
    });

    return () => {
      socket.off('reminder:due');
      socket.off('emergency:alert');
    };
  }, [isAuthenticated, user, toast]);

  return null; // This component doesn't render anything visible
}
