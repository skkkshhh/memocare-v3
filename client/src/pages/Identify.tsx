"use client";

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
  const [linkedContactId, setLinkedContactId] = useState<string | undefined>(undefined);
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
    onSuccess: () => {
      toast({ 
        title: 'Photo uploaded successfully',
        description: 'Photo has been tagged and saved'
      });
      resetForm();
    },
  });

  // --- CAMERA FUNCTIONS ---
  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setTimeout(() => {
          videoRef.current?.play().catch(() => {
            console.warn('Autoplay prevented; user interaction needed');
          });
        }, 100);
      }

      setIsCapturing(true);
    } catch {
      toast({
        title: 'Camera error',
        description: 'Could not access camera. Check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
        setPhotoFile(file);
        setCapturedPhoto(URL.createObjectURL(blob));
      }
    }, 'image/jpeg', 0.8);

    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setCapturedPhoto(URL.createObjectURL(file));
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
    if (linkedContactId) formData.append('linked_contact_id', linkedContactId);
    formData.append('notes', notes);

    uploadMutation.mutate(formData);
  };

  const resetForm = () => {
    setCapturedPhoto(null);
    setPhotoFile(null);
    setTags('');
    setLinkedContactId(undefined);
    setNotes('');
    stopCamera();
  };

  return (
    <div className="p-8">
      <h2 className="text-4xl font-semibold mb-4">Identify & Tag</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera & Upload */}
        <Card>
          <CardHeader><CardTitle>Capture / Upload Photo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!capturedPhoto && !isCapturing && (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground"/>
                <div className="flex justify-center gap-4">
                  <Button onClick={startCamera}><Camera className="w-4 h-4 mr-2"/>Use Camera</Button>
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span><Upload className="w-4 h-4 mr-2"/>Upload Photo</span>
                    </Button>
                  </Label>
                  <Input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload}/>
                </div>
              </div>
            )}

            {isCapturing && (
              <div className="relative">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg"/>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                  <Button onClick={capturePhoto} size="lg" className="rounded-full h-16 w-16"><Camera className="w-6 h-6"/></Button>
                  <Button onClick={stopCamera} variant="outline">Cancel</Button>
                </div>
              </div>
            )}

            {capturedPhoto && (
              <div className="relative">
                <img src={capturedPhoto} alt="Captured" className="w-full rounded-lg"/>
                <Button onClick={resetForm} variant="outline" className="absolute top-2 right-2">Retake</Button>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden"/>
          </CardContent>
        </Card>

        {/* Tagging */}
        <Card>
          <CardHeader><CardTitle>Tag & Identify</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Tags</Label>
                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="family, celebration, etc."/>
              </div>

              <div>
                <Label>Link to Contact</Label>
                <Select value={linkedContactId} onValueChange={setLinkedContactId}>
                  <SelectTrigger><SelectValue placeholder="Select a person (optional)"/></SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact: any) => (
                      <SelectItem key={contact.id} value={contact.id.toString()}>
                        {contact.name} ({contact.relation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes"/>
              </div>

              <Button type="submit" className="w-full" disabled={!photoFile || uploadMutation.isPending}>
                {uploadMutation.isPending ? 'Saving...' : 'Save Photo & Tags'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
