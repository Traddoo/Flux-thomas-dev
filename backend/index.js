const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const Replicate = require('replicate');
const multer = require('multer');
const fs = require('fs');

console.log('Current working directory:', process.cwd());
console.log('.env file path:', path.join(process.cwd(), '.env'));
console.log('REPLICATE_API_TOKEN:', process.env.REPLICATE_API_TOKEN);

const app = express();
const PORT = 4000;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const upload = multer({ dest: 'uploads/' });

if (!process.env.REPLICATE_API_TOKEN) {
  console.error('REPLICATE_API_TOKEN is not set in the environment');
  process.exit(1);
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.post('/generate-image', upload.array('image', 4), async (req, res) => {
  try {
    const {
      prompt,
      num_steps,
      style_name,
      num_outputs,
      guidance_scale,
      negative_prompt,
      style_strength_ratio,
      seed,
      selectedModel,
      // Flux model parameters
      quality,
      promptStrength,
      aspectRatio,
      imageFormat,
      disableSafetyCheck,
    } = req.body;

    let input;
    let model;

    if (selectedModel === 'photomaker') {
      input = {
        prompt: prompt, // Remove the " img" here
        num_steps: parseInt(num_steps) || 50,
        style_name: style_name || "Photographic (Default)",
        num_outputs: parseInt(num_outputs) || 1,
        guidance_scale: parseFloat(guidance_scale) || 5,
        negative_prompt: negative_prompt || "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
        style_strength_ratio: parseInt(style_strength_ratio) || 20
      };

      if (seed) {
        input.seed = parseInt(seed);
      }

      model = "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4";
    } else {
      // Existing Flux model code
      input = {
        prompt,
        guidance: 3.5,
        num_outputs: parseInt(num_outputs) || 1,
        aspect_ratio: aspectRatio || "16:9",
        output_format: imageFormat || "png",
        output_quality: parseInt(quality) || 50,
        prompt_strength: parseFloat(promptStrength) || 0.5,
        num_inference_steps: 28,
        disable_safety_check: disableSafetyCheck === 'true',
      };

      model = "black-forest-labs/flux-dev";
    }

    if (req.files && req.files.length > 0) {
      input.input_image = await fileToBase64(req.files[0].path);
      if (req.files.length > 1 && selectedModel === 'photomaker') {
        input.input_image2 = await fileToBase64(req.files[1].path);
        if (req.files.length > 2) {
          input.input_image3 = await fileToBase64(req.files[2].path);
        }
        if (req.files.length > 3) {
          input.input_image4 = await fileToBase64(req.files[3].path);
        }
      }
    }

    console.log('Selected Model:', selectedModel);
    console.log('Input to Replicate API:', JSON.stringify(input, null, 2));

    const output = await replicate.run(model, { input });

    console.log('Output from Replicate API:', output);

    res.json({ imageUrls: output });
  } catch (error) {
    console.error('Detailed error:', error);
    console.error('Error stack:', error.stack);
    if (error.response) {
      console.error('Error response:', error.response.data);
      res.status(error.response.status || 500).json({ 
        error: 'Failed to generate image', 
        details: error.response.data,
        status: error.response.status
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to generate image', 
        details: error.message, 
        stack: error.stack 
      });
    }
  } finally {
    // Clean up uploaded files
    if (req.files) {
      req.files.forEach(file => fs.unlinkSync(file.path));
    }
  }
});

// Helper function to convert file to base64
async function fileToBase64(filePath) {
  const imageBuffer = await fs.promises.readFile(filePath);
  return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working' });
});
