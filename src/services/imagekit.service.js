const imagekit = require('../config/imagekit');

async function uploadImage(buffer, fileName) {
  const base64 = buffer.toString('base64');
  const result = await imagekit.files.upload({
    file: base64,
    fileName,
    folder: '/plantia/plants/',
  });
  return { url: result.url, fileId: result.fileId };
}

async function deleteImage(fileId) {
  await imagekit.files.delete(fileId);
}

module.exports = { uploadImage, deleteImage };
