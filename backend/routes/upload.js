// routes/upload.js
const router     = require('express').Router();
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const { auth }   = require('../middleware/auth');

// Cloudinary config via env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer — armazena em memória (buffer), depois envia pro Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas.'));
  },
});

// POST /api/upload/key-image
// Retorna: { url, public_id }
router.post('/key-image', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada.' });

  try {
    // Upload para Cloudinary usando stream do buffer
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder:         'chaveiro-pro/keys',
          transformation: [{ width: 600, height: 300, crop: 'fit' }],
          format:         'webp',
          quality:        'auto',
        },
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/upload/key-image
// Body: { public_id }
router.delete('/key-image', auth, async (req, res) => {
  const { public_id } = req.body;
  if (!public_id) return res.status(400).json({ error: 'public_id obrigatório.' });
  try {
    await cloudinary.uploader.destroy(public_id);
    res.json({ message: 'Imagem removida.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
