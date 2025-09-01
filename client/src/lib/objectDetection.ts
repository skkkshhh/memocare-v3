import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

let model: cocoSsd.ObjectDetection | null = null;

export interface DetectedObject {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export interface ObjectSignature {
  objects: DetectedObject[];
  dominantObjects: string[]; // Top 3 most confident objects
  objectCount: number;
}

// Initialize the COCO-SSD model
export const loadModel = async (): Promise<cocoSsd.ObjectDetection> => {
  if (model) return model;
  
  try {
    // Load the model
    model = await cocoSsd.load();
    return model;
  } catch (error) {
    console.error('Failed to load object detection model:', error);
    throw new Error('Could not load object detection model');
  }
};

// Detect objects in an image element
export const detectObjects = async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<DetectedObject[]> => {
  try {
    const loadedModel = await loadModel();
    const predictions = await loadedModel.detect(imageElement);
    
    return predictions.map(prediction => ({
      class: prediction.class,
      score: prediction.score,
      bbox: prediction.bbox as [number, number, number, number]
    }));
  } catch (error) {
    console.error('Object detection failed:', error);
    return [];
  }
};

// Create a visual signature for object matching
export const createObjectSignature = (detectedObjects: DetectedObject[]): ObjectSignature => {
  // Filter objects with confidence > 0.5
  const confidentObjects = detectedObjects.filter(obj => obj.score > 0.5);
  
  // Sort by confidence and get top 3
  const sortedObjects = confidentObjects.sort((a, b) => b.score - a.score);
  const dominantObjects = sortedObjects.slice(0, 3).map(obj => obj.class);
  
  return {
    objects: confidentObjects,
    dominantObjects,
    objectCount: confidentObjects.length
  };
};

// Calculate similarity between two object signatures
export const calculateSimilarity = (sig1: ObjectSignature, sig2: ObjectSignature): number => {
  // Simple similarity based on shared dominant objects
  const shared = sig1.dominantObjects.filter(obj => sig2.dominantObjects.includes(obj));
  const total = new Set([...sig1.dominantObjects, ...sig2.dominantObjects]).size;
  
  if (total === 0) return 0;
  
  // Weight by confidence and object count similarity
  const objectCountSimilarity = 1 - Math.abs(sig1.objectCount - sig2.objectCount) / Math.max(sig1.objectCount, sig2.objectCount, 1);
  const objectSimilarity = shared.length / total;
  
  // Combine similarities (70% object overlap, 30% count similarity)
  return (objectSimilarity * 0.7) + (objectCountSimilarity * 0.3);
};

// Find matches in stored object signatures
export const findMatches = (newSignature: ObjectSignature, storedSignatures: { id: number; signature: ObjectSignature; userTag: string }[]): Array<{ id: number; userTag: string; confidence: number }> => {
  const matches = storedSignatures
    .map(stored => ({
      id: stored.id,
      userTag: stored.userTag,
      confidence: calculateSimilarity(newSignature, stored.signature)
    }))
    .filter(match => match.confidence > 0.4) // Minimum confidence threshold
    .sort((a, b) => b.confidence - a.confidence);
  
  return matches.slice(0, 3); // Return top 3 matches
};

// Process an image for object recognition
export const processImageForRecognition = async (imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) => {
  const detectedObjects = await detectObjects(imageElement);
  const signature = createObjectSignature(detectedObjects);
  
  return {
    detectedObjects,
    signature,
    visualFeatures: JSON.stringify(signature) // Store as JSON string for database
  };
};