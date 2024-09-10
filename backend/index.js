require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Replicate = require('replicate');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(cors());

const upload = multer({ dest: 'uploads/' });

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

app.post('/generate-image', upload.single('image'), async (req, res) => {
  try {
    const {
      prompt,
      quality,
      promptStrength,
      aspectRatio,
      imageFormat,
      disableSafetyCheck,
      numOutputs,
    } = req.body;

    const input = {
      prompt,
      guidance: 3.5,
      num_outputs: parseInt(numOutputs),
      aspect_ratio: aspectRatio,
      output_format: imageFormat,
      output_quality: parseInt(quality),
      prompt_strength: parseFloat(promptStrength),
      num_inference_steps: 28,
      disable_safety_check: disableSafetyCheck === 'true',
    };

    if (req.file) {
      const imagePath = path.join(__dirname, req.file.path);
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      input.image = `data:image/${req.file.mimetype};base64,${base64Image}`;
      
      // Clean up the uploaded file
      fs.unlinkSync(imagePath);
    }

    console.log('Input to Replicate API:', { ...input, image: input.image ? 'base64_image_data' : undefined });

    const output = await replicate.run("black-forest-labs/flux-dev", { input });

    res.json({ imageUrls: output });
  } catch (error) {
    console.error('Error generating image:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
