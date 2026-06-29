const cloudinary = require('cloudinary').v2;

const isConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary Service Configured');
} else {
  console.log('Cloudinary credentials missing. Falling back to Base64 storage in database.');
}

/**
 * Uploads a file buffer to Cloudinary, or falls back to returning a Base64 Data URI.
 * @param {Object} file Multer file object
 * @returns {Promise<string>} Image URL or Base64 string
 */
const uploadImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error('No file buffer provided.'));
    }

    if (isConfigured) {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'campuskart' },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error, falling back to Base64:', error);
            // Fallback to Base64 in case Cloudinary API fails
            const base64Data = file.buffer.toString('base64');
            return resolve(`data:${file.mimetype};base64,${base64Data}`);
          }
          resolve(result.secure_url);
        }
      );
      uploadStream.end(file.buffer);
    } else {
      // Direct Base64 conversion
      const base64Data = file.buffer.toString('base64');
      resolve(`data:${file.mimetype};base64,${base64Data}`);
    }
  });
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadImage
};
