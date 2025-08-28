import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFormData, contactsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Tag, Users } from 'lucide-react';

export default function Identify() {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [tags, setTags] = useState('');
  const [linkedContactId, setLinkedContactId] = useState('');
  const [notes, setNotes] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsApi.list,
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => apiFormData('/api/identify', formData),
    onSuccess: (data) => {
      toast({ 
        title: 'Photo uploaded successfully',
        description: 'Photo has been tagged and saved'
      });
      resetForm();
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      toast({
        title: 'Camera error',
        description: 'Could not access camera. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCapturedPhoto(url);
        setPhotoFile(new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' }));
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setCapturedPhoto(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile) {
      toast({
        title: 'No photo selected',
        description: 'Please capture or upload a photo first',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('tags', tags);
    formData.append('linked_contact_id', linkedContactId);
    formData.append('notes', notes);

    uploadMutation.mutate(formData);
  };

  const resetForm = () => {
    setCapturedPhoto(null);
    setPhotoFile(null);
    setTags('');
    setLinkedContactId('');
    setNotes('');
    stopCamera();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-4xl font-semibold text-foreground mb-2" data-testid="identify-title">
          Identify & Tag
        </h2>
        <p className="text-xl text-muted-foreground">
          Capture or upload photos and tag them with people and memories
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera/Upload Section */}
        <Card data-testid="card-camera">
          <CardHeader>
            <CardTitle>Capture or Upload Photo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!capturedPhoto && !isCapturing && (
              <div className="space-y-4">
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Capture a new photo or upload from device
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      onClick={startCamera}
                      data-testid="button-start-camera"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Use Camera
                    </Button>
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      data-testid="input-photo-upload"
                    />
                  </div>
                </div>
              </div>
            )}

            {isCapturing && (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg"
                    data-testid="video-preview"
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    <Button
                      onClick={capturePhoto}
                      size="lg"
                      className="rounded-full h-16 w-16"
                      data-testid="button-capture-photo"
                    >
                      <Camera className="w-6 h-6" />
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="outline"
                      data-testid="button-stop-camera"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {capturedPhoto && (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={capturedPhoto}
                    alt="Captured or uploaded"
                    className="w-full rounded-lg"
                    data-testid="captured-photo"
                  />
                  <Button
                    onClick={resetForm}
                    variant="outline"
                    className="absolute top-2 right-2"
                    data-testid="button-retake-photo"
                  >
                    Retake
                  </Button>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </CardContent>
        </Card>

        {/* Tagging Section */}
        <Card data-testid="card-tagging">
          <CardHeader>
            <CardTitle>Tag & Identify</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="family, celebration, outdoor, etc."
                  data-testid="input-tags"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Add comma-separated tags to help identify this photo
                </p>
              </div>

              <div>
                <Label htmlFor="linked-contact">Link to Contact</Label>
                <Select value={linkedContactId} onValueChange={setLinkedContactId}>
                  <SelectTrigger data-testid="select-linked-contact">
                    <SelectValue placeholder="Select a person (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No contact</SelectItem>
                    {contacts.map((contact: any) => (
                      <SelectItem key={contact.id} value={contact.id.toString()}>
                        {contact.name} ({contact.relation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Link this photo to someone in your contacts
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about this photo"
                  data-testid="input-notes"
                />
              </div>

              <Button
                type="submit"
                disabled={!photoFile || uploadMutation.isPending}
                className="w-full"
                data-testid="button-save-identification"
              >
                {uploadMutation.isPending ? 'Saving...' : 'Save Photo & Tags'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Recent Identifications */}
      <Card className="mt-8" data-testid="card-recent-identifications">
        <CardHeader>
          <CardTitle>Recent Identifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8" data-testid="empty-identifications">
            <Tag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No photos tagged yet</h3>
            <p className="text-muted-foreground">
              Start by capturing or uploading a photo above
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
