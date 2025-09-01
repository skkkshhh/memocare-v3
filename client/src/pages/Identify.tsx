"use client";

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFormData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Tag, Users, Scan, Brain, Check, Eye } from 'lucide-react';
import { processImageForRecognition, findMatches, type DetectedObject, type ObjectSignature } from '@/lib/objectDetection';

export default function Identify() {
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [tags, setTags] = useState('');
  const [linkedContactId, setLinkedContactId] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [objectSignature, setObjectSignature] = useState<ObjectSignature | null>(null);
  const [matchedObjects, setMatchedObjects] = useState<Array<{ id: number; userTag: string; confidence: number }>>([]);
  const [modelLoading, setModelLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const response = await fetch('/api/contacts', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error('Failed to fetch contacts');
      }
      return response.json();
    },
    retry: false,
  });

  // Query for stored object recognitions
  const { data: storedObjects = [] } = useQuery({
    queryKey: ['object-recognitions'],
    queryFn: async () => {
      const response = await fetch('/api/identify/objects', { credentials: 'include' });
      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error('Failed to fetch objects');
      }
      return response.json();
    },
    retry: false,
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => apiFormData('/api/identify', formData),
    onSuccess: () => {
      toast({ 
        title: 'Photo uploaded successfully',
        description: 'Photo has been tagged and saved'
      });
      queryClient.invalidateQueries({ queryKey: ['object-recognitions'] });
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
        
        // Automatically analyze the captured photo
        analyzePhoto(canvas);
      }
    }, 'image/jpeg', 0.8);

    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const photoUrl = URL.createObjectURL(file);
      setCapturedPhoto(photoUrl);
      
      // Analyze uploaded photo
      const img = new Image();
      img.onload = () => analyzePhoto(img);
      img.src = photoUrl;
    }
  };

  // Object recognition analysis
  const analyzePhoto = async (imageElement: HTMLImageElement | HTMLCanvasElement) => {
    setIsAnalyzing(true);
    setModelLoading(true);
    
    try {
      const { detectedObjects, signature, visualFeatures } = await processImageForRecognition(imageElement);
      
      setDetectedObjects(detectedObjects);
      setObjectSignature(signature);
      setModelLoading(false);
      
      // Find matches with stored objects
      if (storedObjects.length > 0) {
        const storedSignatures = storedObjects.map((obj: any) => ({
          id: obj.id,
          signature: JSON.parse(obj.visual_features),
          userTag: obj.user_tag
        }));
        
        const matches = findMatches(signature, storedSignatures);
        setMatchedObjects(matches);
        
        if (matches.length > 0) {
          toast({
            title: 'Object recognized!',
            description: `Found ${matches.length} similar object(s) from your history`,
          });
        }
      }
      
    } catch (error) {
      console.error('Object analysis failed:', error);
      toast({
        title: 'Analysis failed',
        description: 'Could not analyze the photo. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
      setModelLoading(false);
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
    
    // Include object recognition data if available
    if (detectedObjects.length > 0) {
      formData.append('detected_objects', JSON.stringify(detectedObjects));
    }
    if (objectSignature) {
      formData.append('visual_features', JSON.stringify(objectSignature));
    }

    uploadMutation.mutate(formData);
  };

  const resetForm = () => {
    setCapturedPhoto(null);
    setPhotoFile(null);
    setTags('');
    setLinkedContactId(undefined);
    setNotes('');
    setDetectedObjects([]);
    setObjectSignature(null);
    setMatchedObjects([]);
    setIsAnalyzing(false);
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
                <img ref={imageRef} src={capturedPhoto} alt="Captured" className="w-full rounded-lg"/>
                <Button onClick={resetForm} variant="outline" className="absolute top-2 right-2">Retake</Button>
                
                {(isAnalyzing || modelLoading) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <Brain className="w-8 h-8 mx-auto mb-2 animate-pulse"/>
                      <p>{modelLoading ? 'Loading AI model...' : 'Analyzing objects...'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <canvas ref={canvasRef} className="hidden"/>
          </CardContent>
        </Card>

        {/* Analysis Results & Tagging */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5"/>
              Tag & Identify
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Object Recognition Results */}
            {detectedObjects.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Detected Objects</Label>
                <div className="flex flex-wrap gap-2">
                  {detectedObjects.map((obj, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Scan className="w-3 h-3"/>
                      {obj.class} ({Math.round(obj.score * 100)}%)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Objects */}
            {matchedObjects.length > 0 && (
              <Alert>
                <Check className="w-4 h-4"/>
                <AlertDescription>
                  <strong>Object recognized!</strong> Found {matchedObjects.length} similar item(s):
                  <div className="mt-2 space-y-1">
                    {matchedObjects.map((match, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium">"{match.userTag}"</span>
                        <Badge variant="outline">{Math.round(match.confidence * 100)}% match</Badge>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Your Tag/Description</Label>
                <Input 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)} 
                  placeholder={detectedObjects.length > 0 ? 
                    `Describe this ${detectedObjects[0]?.class || 'object'}...` : 
                    "Describe what you see..."
                  }
                />
                {matchedObjects.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-1">Quick fill from matches:</p>
                    <div className="flex flex-wrap gap-1">
                      {matchedObjects.slice(0, 3).map((match, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setTags(match.userTag)}
                          className="text-xs"
                        >
                          {match.userTag}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
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
                {uploadMutation.isPending ? 'Saving...' : 
                 detectedObjects.length > 0 ? 'Save Identified Object' : 'Save Photo & Tags'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
