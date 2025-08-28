import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emergencyApi, contactsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Phone, MapPin, Clock, Check, Users } from 'lucide-react';

export default function Emergency() {
  const [isTriggering, setIsTriggering] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: emergencyAlerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['emergency'],
    queryFn: emergencyApi.list,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsApi.list,
  });

  const triggerEmergencyMutation = useMutation({
    mutationFn: emergencyApi.trigger,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency'] });
      setIsTriggering(false);
      toast({
        title: 'Emergency Alert Sent',
        description: 'Your emergency contacts have been notified.',
        variant: 'destructive',
      });
    },
  });

  const resolveEmergencyMutation = useMutation({
    mutationFn: (id: number) => emergencyApi.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency'] });
      toast({ title: 'Emergency alert resolved' });
    },
  });

  const handleEmergencyTrigger = () => {
    setIsTriggering(true);
    triggerEmergencyMutation.mutate();
  };

  const emergencyContacts = contacts.filter((contact: any) => 
    ['family', 'caregiver', 'doctor'].includes(contact.relation.toLowerCase())
  );

  if (alertsLoading) {
    return <div className="p-8">Loading emergency information...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-semibold text-foreground mb-2" data-testid="emergency-title">
          Emergency Help
        </h2>
        <p className="text-xl text-muted-foreground">
          Get immediate assistance when you need it most
        </p>
      </div>

      {/* Emergency Trigger Section */}
      <Card className="mb-8 border-destructive/20" data-testid="card-emergency-trigger">
        <CardContent className="p-8 text-center">
          <div className="w-24 h-24 bg-destructive rounded-full mx-auto mb-6 flex items-center justify-center emergency-pulse">
            <AlertTriangle className="text-4xl text-destructive-foreground" />
          </div>
          
          <h3 className="text-3xl font-semibold text-card-foreground mb-4">
            Need Help?
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Press the button below to immediately notify your emergency contacts and request assistance.
          </p>
          
          <Button
            size="lg"
            variant="destructive"
            onClick={handleEmergencyTrigger}
            disabled={isTriggering || triggerEmergencyMutation.isPending}
            className="text-xl px-12 py-6 emergency-pulse"
            data-testid="button-trigger-emergency"
          >
            {isTriggering || triggerEmergencyMutation.isPending ? (
              'Sending Alert...'
            ) : (
              <>
                <AlertTriangle className="w-6 h-6 mr-3" />
                Emergency Alert
              </>
            )}
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            This will send alerts to {emergencyContacts.length} emergency contact(s)
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Emergency Contacts */}
        <Card data-testid="card-emergency-contacts">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center space-x-2">
              <Users className="w-6 h-6" />
              <span>Emergency Contacts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emergencyContacts.length === 0 ? (
              <div className="text-center py-8" data-testid="empty-emergency-contacts">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No emergency contacts</h3>
                <p className="text-muted-foreground mb-4">
                  Add family members, caregivers, or doctors as emergency contacts
                </p>
                <Button variant="outline">
                  Add Contacts
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {emergencyContacts.map((contact: any) => (
                  <div key={contact.id} className="p-4 border border-border rounded-lg" data-testid={`emergency-contact-${contact.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-secondary-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-card-foreground">{contact.name}</h4>
                          <p className="text-sm text-muted-foreground">{contact.relation}</p>
                          {contact.phone && (
                            <p className="text-sm text-muted-foreground">{contact.phone}</p>
                          )}
                        </div>
                      </div>
                      {contact.phone && (
                        <Button
                          size="sm"
                          onClick={() => window.open(`tel:${contact.phone}`)}
                          data-testid={`button-call-emergency-${contact.id}`}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency History */}
        <Card data-testid="card-emergency-history">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center space-x-2">
              <Clock className="w-6 h-6" />
              <span>Recent Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emergencyAlerts.length === 0 ? (
              <div className="text-center py-8" data-testid="empty-emergency-alerts">
                <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No emergency alerts</h3>
                <p className="text-muted-foreground">
                  Your emergency alert history will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {emergencyAlerts.slice(0, 10).map((alert: any) => (
                  <div key={alert.id} className="p-4 border border-border rounded-lg" data-testid={`alert-${alert.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${alert.resolved ? 'bg-accent' : 'bg-destructive'}`} />
                        <div>
                          <p className="font-medium text-card-foreground">
                            Emergency alert triggered
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(alert.triggered_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={alert.resolved ? 'default' : 'destructive'}>
                          {alert.resolved ? 'Resolved' : 'Active'}
                        </Badge>
                        {!alert.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveEmergencyMutation.mutate(alert.id)}
                            disabled={resolveEmergencyMutation.isPending}
                            data-testid={`button-resolve-${alert.id}`}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emergency Information */}
      <Card className="mt-8" data-testid="card-emergency-info">
        <CardHeader>
          <CardTitle className="text-2xl">Emergency Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Phone className="w-8 h-8 mx-auto mb-2 text-destructive" />
              <h4 className="font-semibold mb-1">Emergency Services</h4>
              <p className="text-sm text-muted-foreground mb-2">Call 911 for immediate help</p>
              <Button size="sm" variant="destructive" onClick={() => window.open('tel:911')}>
                Call 911
              </Button>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <MapPin className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h4 className="font-semibold mb-1">Location Sharing</h4>
              <p className="text-sm text-muted-foreground mb-2">Your location is shared when alerts are sent</p>
              <Button size="sm" variant="outline" disabled>
                Auto-Enabled
              </Button>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-accent" />
              <h4 className="font-semibold mb-1">Alert System</h4>
              <p className="text-sm text-muted-foreground mb-2">Contacts notified via call, text, and app</p>
              <Button size="sm" variant="outline" disabled>
                Active
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
