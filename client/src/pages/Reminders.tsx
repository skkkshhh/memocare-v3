import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remindersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Bell, Pill, Calendar, ListTodo, Trash2 } from 'lucide-react';

export default function Reminders() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [schedule, setSchedule] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: remindersApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => remindersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setShowForm(false);
      setTitle('');
      setType('');
      setSchedule('');
      toast({ title: 'Reminder created successfully' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => remindersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast({ title: 'Reminder deleted' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => 
      remindersApi.update(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !type || !schedule) return;

    const nextRun = new Date();
    if (schedule === 'hourly') {
      nextRun.setHours(nextRun.getHours() + 1);
    } else if (schedule === 'daily') {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    createMutation.mutate({
      title,
      type,
      schedule_cron: schedule === 'hourly' ? '0 * * * *' : '0 9 * * *',
      next_run_at: nextRun.toISOString(),
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medication': return <Pill className="w-5 h-5" />;
      case 'appointment': return <Calendar className="w-5 h-5" />;
      case 'task': return <ListTodo className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading reminders...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-semibold text-foreground mb-2" data-testid="reminders-title">
            Reminders
          </h2>
          <p className="text-xl text-muted-foreground">
            Stay on top of your daily tasks and medications
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          data-testid="button-add-reminder"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Reminder
        </Button>
      </div>

      {/* Add Reminder Form */}
      {showForm && (
        <Card className="mb-8" data-testid="card-add-reminder">
          <CardHeader>
            <CardTitle>Create New Reminder</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Take morning medication"
                    required
                    data-testid="input-reminder-title"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={setType} required>
                    <SelectTrigger data-testid="select-reminder-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medication">Medication</SelectItem>
                      <SelectItem value="meal">Meal</SelectItem>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="schedule">Schedule</Label>
                <Select value={schedule} onValueChange={setSchedule} required>
                  <SelectTrigger data-testid="select-reminder-schedule">
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Every Hour</SelectItem>
                    <SelectItem value="daily">Daily at 9:00 AM</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  data-testid="button-save-reminder"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Reminder'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                  data-testid="button-cancel-reminder"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reminders List */}
      <div className="space-y-4">
        {reminders.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center" data-testid="empty-reminders">
                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No reminders yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first reminder to stay organized
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reminder
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          reminders.map((reminder: any) => (
            <Card key={reminder.id} data-testid={`reminder-card-${reminder.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                      {getTypeIcon(reminder.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">
                        {reminder.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {reminder.type} • Next: {new Date(reminder.next_run_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`active-${reminder.id}`}>Active</Label>
                      <Switch
                        id={`active-${reminder.id}`}
                        checked={reminder.active}
                        onCheckedChange={(checked) => 
                          toggleMutation.mutate({ id: reminder.id, active: checked })
                        }
                        data-testid={`switch-reminder-active-${reminder.id}`}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(reminder.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-reminder-${reminder.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
