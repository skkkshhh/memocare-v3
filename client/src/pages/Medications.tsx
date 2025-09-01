import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicationsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pill, Check, X, Clock } from 'lucide-react';

export default function Medications() {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: medications = [], isLoading } = useQuery({
    queryKey: ['medications'],
    queryFn: medicationsApi.list,
  });

  // Get all medication logs at once for all medications
  const medicationIds = medications.map((m: any) => m.id);
  const { data: allLogs = {} } = useQuery({
    queryKey: ['all-medication-logs', medicationIds],
    queryFn: async () => {
      if (medicationIds.length === 0) return {};
      try {
        const logsPromises = medicationIds.map((id: number) => 
          medicationsApi.logs(id).then(logs => ({ [id]: logs })).catch(() => ({ [id]: [] }))
        );
        const logsArray = await Promise.all(logsPromises);
        return logsArray.reduce((acc, logs) => ({ ...acc, ...logs }), {});
      } catch (error) {
        console.warn('Failed to fetch medication logs:', error);
        return {};
      }
    },
    enabled: medicationIds.length > 0,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => medicationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setShowForm(false);
      setName('');
      setDosage('');
      setNotes('');
      toast({ title: 'Medication added successfully' });
    },
  });

  const logDoseMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'taken' | 'missed' }) =>
      medicationsApi.logDose(id, status, new Date().toISOString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['all-medication-logs'] });
      toast({ title: 'Dose logged successfully' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage) return;

    createMutation.mutate({ name, dosage, notes });
  };

  if (isLoading) {
    return <div className="p-8">Loading medications...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-semibold text-foreground mb-2" data-testid="medications-title">
            Medications
          </h2>
          <p className="text-xl text-muted-foreground">
            Track your medications and log doses
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          data-testid="button-add-medication"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {/* Add Medication Form */}
      {showForm && (
        <Card className="mb-8" data-testid="card-add-medication">
          <CardHeader>
            <CardTitle>Add New Medication</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Medication Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aricept"
                    required
                    data-testid="input-medication-name"
                  />
                </div>
                <div>
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="10mg"
                    required
                    data-testid="input-medication-dosage"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take with breakfast"
                  data-testid="textarea-medication-notes"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  data-testid="button-save-medication"
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Medication'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                  data-testid="button-cancel-medication"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Medications List */}
      <div className="space-y-6">
        {medications.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center" data-testid="empty-medications">
                <Pill className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No medications added</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first medication to start tracking
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          medications.map((medication: any) => {
            const logs = allLogs[medication.id] || [];

            // Get last 7 days
            const last7Days = Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              return date.toDateString();
            });

            // Map logs to days
            const logsByDay = logs.reduce((acc: any, log: any) => {
              const logDate = new Date(log.taken_at).toDateString();
              acc[logDate] = log;
              return acc;
            }, {});

            return (
              <Card key={medication.id} data-testid={`medication-card-${medication.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-card-foreground">
                        {medication.name}
                      </h3>
                      <p className="text-muted-foreground">
                        {medication.dosage} {medication.notes && ` • ${medication.notes}`}
                      </p>
                      {logs.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last taken: {new Date(logs[logs.length - 1]?.taken_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => logDoseMutation.mutate({ id: medication.id, status: 'taken' })}
                        disabled={logDoseMutation.isPending}
                        data-testid={`button-log-taken-${medication.id}`}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Taken
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => logDoseMutation.mutate({ id: medication.id, status: 'missed' })}
                        disabled={logDoseMutation.isPending}
                        data-testid={`button-log-missed-${medication.id}`}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Missed
                      </Button>
                    </div>
                  </div>

                  {/* Weekly Progress with real data */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Last 7 days:</span>
                    <div className="flex space-x-1">
                      {last7Days.map((day, index) => {
                        const log = logsByDay[day];
                        const status = log?.status;
                        
                        return (
                          <div
                            key={index}
                            className={`w-8 h-8 rounded flex items-center justify-center ${
                              status === 'taken'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                : status === 'missed'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                : 'bg-muted text-muted-foreground'
                            }`}
                            data-testid={`medication-day-${medication.id}-${index}`}
                            title={log ? `${status} on ${new Date(log.taken_at).toLocaleDateString()}` : `No data for ${new Date(day).toLocaleDateString()}`}
                          >
                            {status === 'taken' ? (
                              <Check className="w-3 h-3" />
                            ) : status === 'missed' ? (
                              <X className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
