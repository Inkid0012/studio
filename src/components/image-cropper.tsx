
'use client';

import { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Crop as CropIcon, Check } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onClose: () => void;
}

function getCroppedImg(
    image: HTMLImageElement,
    crop: Crop,
    fileName: string
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
  
    if (!ctx) {
      return Promise.reject(new Error('Canvas context is not available'));
    }
  
    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';
  
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );
  
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const reader = new FileReader();
          reader.addEventListener('load', () => resolve(reader.result as string));
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.95
      );
    });
}

export function ImageCropper({ imageSrc, onCropComplete, onClose }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
  
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const newCrop = centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          1, // aspect ratio 1:1
          width,
          height
        ),
        width,
        height
      );
    setCrop(newCrop);
  }

  const handleCrop = async () => {
    if (imgRef.current && crop?.width && crop?.height) {
      try {
        const croppedImageUrl = await getCroppedImg(imgRef.current, crop, 'newProfilePic.jpeg');
        onCropComplete(croppedImageUrl);
      } catch (e) {
        console.error('Cropping failed: ', e);
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon />
            Crop your photo
          </DialogTitle>
          <DialogDescription>
            Adjust the square to select the part of the photo you want to use for your profile.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
            <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                aspect={1}
                minWidth={100}
                circularCrop={true}
            >
                <img ref={imgRef} src={imageSrc} onLoad={onImageLoad} alt="Image to crop" style={{maxHeight: '70vh'}}/>
            </ReactCrop>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCrop}>
            <Check className="mr-2 h-4 w-4" />
            Use Photo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

