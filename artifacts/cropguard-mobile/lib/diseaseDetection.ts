import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { toByteArray } from 'base64-js';
import jpeg from 'jpeg-js';

export type DetectionMode = 'model' | 'preview';

export interface DiseaseDetection {
  disease: string;
  confidence: number;
  severity: 'Good' | 'Monitor' | 'Alert';
  medicine: string;
  fertilizer: string;
  prevention: string;
  usage: string;
  mode: DetectionMode;
}

type TfliteModel = {
  run: (inputs: ArrayBuffer[]) => Promise<ArrayBuffer[]>;
};

type TfliteModule = {
  loadTensorflowModel: (source: { url: string }, delegates?: string[]) => Promise<TfliteModel>;
};

const MODEL_URL = process.env.EXPO_PUBLIC_YOLO_MODEL_URL;
const DEFAULT_CLASSES = ['Healthy leaf', 'Leaf spot', 'Blight', 'Rust', 'Aphids', 'Powdery mildew'];

function getClassNames() {
  const configured = process.env.EXPO_PUBLIC_YOLO_CLASS_NAMES
    ?.split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  return configured?.length ? configured : DEFAULT_CLASSES;
}

function previewDetection(): DiseaseDetection {
  return {
    disease: 'Crop health looks good',
    confidence: 0.96,
    severity: 'Good',
    medicine: 'No pesticide is recommended from this preview scan.',
    fertilizer: 'Continue your balanced fertilizer plan and avoid over-application.',
    prevention: 'Keep monitoring new leaves and maintain good field sanitation.',
    usage: 'Use this result as an early screening aid, not as a replacement for an agronomist.',
    mode: 'preview',
  };
}

function guidanceFor(label: string) {
  const normalized = label.toLowerCase();
  if (normalized.includes('aphid')) {
    return {
      severity: 'Alert' as const,
      medicine: 'Use an aphid-labeled treatment only after confirming the infestation and following the product label.',
      fertilizer: 'Avoid excess nitrogen, which can encourage soft growth that attracts aphids.',
      prevention: 'Inspect leaf undersides, remove heavily affected leaves, and encourage beneficial insects.',
      usage: 'Follow the product label, wear protective equipment, and observe the stated pre-harvest interval.',
    };
  }
  if (normalized.includes('blight') || normalized.includes('spot') || normalized.includes('rust') || normalized.includes('mildew')) {
    return {
      severity: 'Monitor' as const,
      medicine: 'Use a disease-labeled fungicide only after confirming the diagnosis and following the product label.',
      fertilizer: 'Maintain balanced nutrition and avoid wetting foliage late in the day.',
      prevention: 'Remove affected plant material, improve airflow, and avoid overhead irrigation when possible.',
      usage: 'Follow the product label, wear protective equipment, and observe the stated pre-harvest interval.',
    };
  }
  return {
    severity: 'Good' as const,
    medicine: 'No treatment is recommended from this detection.',
    fertilizer: 'Continue a balanced fertilizer plan based on your crop and soil test.',
    prevention: 'Keep monitoring the field for changes in color, spots, pests, or wilting.',
    usage: 'Use this result as an early screening aid, not as a replacement for an agronomist.',
  };
}

function parseYoloOutput(output: ArrayBuffer, classNames: string[]): DiseaseDetection {
  const values = new Float32Array(output);
  const channels = 4 + classNames.length;
  if (!values.length || values.length % channels !== 0) {
    throw new Error('The model output does not match the configured YOLOv8 class count.');
  }

  const predictions = values.length / channels;
  let bestClass = 0;
  let bestScore = -Infinity;
  for (let prediction = 0; prediction < predictions; prediction += 1) {
    for (let classIndex = 0; classIndex < classNames.length; classIndex += 1) {
      const score = values[(4 + classIndex) * predictions + prediction];
      if (score > bestScore) {
        bestScore = score;
        bestClass = classIndex;
      }
    }
  }

  const confidence = Math.max(0, Math.min(1, bestScore));
  const disease = classNames[bestClass] ?? DEFAULT_CLASSES[0];
  return {
    disease,
    confidence,
    ...guidanceFor(disease),
    mode: 'model',
  };
}

async function prepareInput(imageUri: string, size = 640): Promise<ArrayBuffer> {
  const image = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: size, height: size } }],
    { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!image.base64) throw new Error('The image could not be encoded for the TFLite model.');

  const decoded = jpeg.decode(toByteArray(image.base64), { useTArray: true });
  const input = new Float32Array(size * size * 3);
  for (let pixel = 0; pixel < size * size; pixel += 1) {
    input[pixel * 3] = (decoded.data[pixel * 4] - 127.5) / 127.5;
    input[pixel * 3 + 1] = (decoded.data[pixel * 4 + 1] - 127.5) / 127.5;
    input[pixel * 3 + 2] = (decoded.data[pixel * 4 + 2] - 127.5) / 127.5;
  }
  return input.buffer;
}

async function runConfiguredModel(imageUri: string): Promise<DiseaseDetection | null> {
  if (Platform.OS === 'web' || !MODEL_URL) return null;

  try {
    const nativeTflite = require('react-native-fast-tflite') as TfliteModule;
    const model = await nativeTflite.loadTensorflowModel({ url: MODEL_URL }, ['android-gpu', 'core-ml']);
    const input = await prepareInput(imageUri);
    const outputs = await model.run([input]);
    return parseYoloOutput(outputs[0], getClassNames());
  } catch (error) {
    console.warn('YOLOv8 TensorFlow Lite inference unavailable:', error);
    return null;
  }
}

export async function detectCropDisease(imageUri?: string): Promise<DiseaseDetection> {
  if (imageUri) {
    const detection = await runConfiguredModel(imageUri);
    if (detection) return detection;
  }
  return previewDetection();
}