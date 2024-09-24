"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/components/ImageUploader";

export default function Home() {
  const [selectedModel, setSelectedModel] = useState("flux");
  const [prompt, setPrompt] = useState("");
  const [quality, setQuality] = useState(50);
  const [promptStrength, setPromptStrength] = useState(0.5);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [imageFormat, setImageFormat] = useState("png");
  const [disableSafetyCheck, setDisableSafetyCheck] = useState(false);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [numOutputs, setNumOutputs] = useState(1);
  const [styleName, setStyleName] = useState("Photographic (Default)");
  const [negativePrompt, setNegativePrompt] = useState("nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry");
  const [numSteps, setNumSteps] = useState(50);
  const [styleStrengthRatio, setStyleStrengthRatio] = useState(20);
  const [guidanceScale, setGuidanceScale] = useState(5);
  const [seed, setSeed] = useState("");

  const handleImageUpload = (file: File) => {
    setImageFile(file);
  };

  const handleGenerateImage = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('selectedModel', selectedModel);

      if (selectedModel === 'photomaker') {
        formData.append('prompt', prompt); // Don't add " img" here
        formData.append('num_steps', numSteps.toString());
        formData.append('style_name', styleName);
        formData.append('num_outputs', numOutputs.toString());
        formData.append('guidance_scale', guidanceScale.toString());
        formData.append('negative_prompt', negativePrompt);
        formData.append('style_strength_ratio', styleStrengthRatio.toString());
        if (seed) formData.append('seed', seed);
      } else {
        formData.append('prompt', prompt);
        formData.append('quality', quality.toString());
        formData.append('promptStrength', promptStrength.toString());
        formData.append('aspectRatio', aspectRatio);
        formData.append('imageFormat', imageFormat);
        formData.append('disableSafetyCheck', disableSafetyCheck.toString());
        formData.append('numOutputs', numOutputs.toString());
      }

      if (imageFile) {
        formData.append('image', imageFile, imageFile.name);
      }

      console.log('Payload sent to backend:', Object.fromEntries(formData));

      const response = await fetch('http://localhost:4000/generate-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(data)}`);
      }

      console.log('Response data:', data);
      setGeneratedImageUrls(data.imageUrls);
    } catch (error) {
      console.error('Detailed error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      alert(`An error occurred while generating the image. Please check the console for details.`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBackendConnection = async () => {
    try {
      console.log('Attempting to connect to backend...');
      const response = await fetch('http://localhost:4000/test');
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Backend connection test:', data);
    } catch (error) {
      console.error('Detailed error connecting to backend:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
      alert('Unable to connect to the backend server. Please ensure it is running and check the console for details.');
    }
  };

  useEffect(() => {
    checkBackendConnection();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-24">
      <h1 className="text-4xl font-bold mb-8">Flux-Thomas Image Generator</h1>
      
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg p-8 shadow-lg">
        <div className="mb-4">
          <label htmlFor="model-select" className="block text-sm font-medium mb-2">
            Select Model
          </label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2"
          >
            <option value="flux">Flux</option>
            <option value="photomaker">PhotoMaker</option>
          </select>
        </div>

        <p className="text-center mb-4">
          Welcome to the Flux-Thomas Image Generator. Get started by entering a prompt.
        </p>
        
        <Textarea
          placeholder="Enter your prompt"
          className="mb-4"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        
        <ImageUploader onImageUpload={handleImageUpload} />

        {selectedModel === "flux" && (
          <>
            <div className="mb-4">
              <label htmlFor="quality-slider" className="block text-sm font-medium mb-2">
                Quality: {quality}
              </label>
              <Slider
                id="quality-slider"
                min={0}
                max={100}
                step={1}
                value={[quality]}
                onValueChange={(value) => setQuality(value[0])}
                className="w-full"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="prompt-strength-slider" className="block text-sm font-medium mb-2">
                Prompt Strength: {promptStrength.toFixed(2)}
              </label>
              <Slider
                id="prompt-strength-slider"
                min={0}
                max={1}
                step={0.01}
                value={[promptStrength]}
                onValueChange={(value) => setPromptStrength(value[0])}
                className="w-full"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Aspect Ratio
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600 hover:text-white"
                  >
                    {aspectRatio}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-700 text-white border-gray-600">
                  <DropdownMenuItem onClick={() => setAspectRatio("16:9")} className="hover:bg-gray-600">
                    16:9
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAspectRatio("9:16")} className="hover:bg-gray-600">
                    9:16
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAspectRatio("1:1")} className="hover:bg-gray-600">
                    1:1
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Select Image Format
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600 hover:text-white"
                  >
                    {imageFormat}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-700 text-white border-gray-600">
                  <DropdownMenuItem onClick={() => setImageFormat("png")} className="hover:bg-gray-600">
                    PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setImageFormat("jpg")} className="hover:bg-gray-600">
                    JPG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setImageFormat("webp")} className="hover:bg-gray-600">
                    WebP
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="disable-safety-check"
                checked={disableSafetyCheck}
                onCheckedChange={(checked) => setDisableSafetyCheck(checked as boolean)}
              />
              <label
                htmlFor="disable-safety-check"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Disable Safety Check
              </label>
            </div>
          </>
        )}
        
        {selectedModel === 'photomaker' && (
          <>
            <div className="mb-4">
              <label htmlFor="style-name" className="block text-sm font-medium mb-2">
                Style Name
              </label>
              <Input
                id="style-name"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="negative-prompt" className="block text-sm font-medium mb-2">
                Negative Prompt
              </label>
              <Textarea
                id="negative-prompt"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="num-steps-slider" className="block text-sm font-medium mb-2">
                Number of Steps: {numSteps}
              </label>
              <Slider
                id="num-steps-slider"
                min={1}
                max={100}
                step={1}
                value={[numSteps]}
                onValueChange={(value) => setNumSteps(value[0])}
                className="w-full"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="style-strength-ratio-slider" className="block text-sm font-medium mb-2">
                Style Strength Ratio: {styleStrengthRatio}%
              </label>
              <Slider
                id="style-strength-ratio-slider"
                min={15}
                max={50}
                step={1}
                value={[styleStrengthRatio]}
                onValueChange={(value) => setStyleStrengthRatio(value[0])}
                className="w-full"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="guidance-scale-slider" className="block text-sm font-medium mb-2">
                Guidance Scale: {guidanceScale}
              </label>
              <Slider
                id="guidance-scale-slider"
                min={1}
                max={10}
                step={0.1}
                value={[guidanceScale]}
                onValueChange={(value) => setGuidanceScale(value[0])}
                className="w-full"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="seed" className="block text-sm font-medium mb-2">
                Seed (optional)
              </label>
              <Input
                id="seed"
                type="number"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="w-full"
                placeholder="Leave blank for random seed"
              />
            </div>
          </>
        )}
        
        <div className="mb-4">
          <label htmlFor="num-outputs-slider" className="block text-sm font-medium mb-2">
            Number of Outputs: {numOutputs}
          </label>
          <Slider
            id="num-outputs-slider"
            min={1}
            max={4}
            step={1}
            value={[numOutputs]}
            onValueChange={(value) => setNumOutputs(value[0])}
            className="w-full"
          />
        </div>
        
        <Button 
          onClick={handleGenerateImage} 
          disabled={isLoading} 
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Generating...' : 'Generate Image'}
        </Button>

        {generatedImageUrls.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Generated Images</h2>
            <div className="grid grid-cols-2 gap-4">
              {generatedImageUrls.map((url, index) => (
                <Image 
                  key={index}
                  src={url} 
                  alt={`Generated Image ${index + 1}`} 
                  width={250} 
                  height={250} 
                  className="rounded-lg"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-8 text-sm text-gray-500">
        Powered by Next.js and Vercel
      </footer>
    </main>
  );
}
