const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function sanitizeFileName(fileName) {
  return fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
}

router.post("/base64", async (req, res) => {
  try {
    console.log(
      "UPLOAD BODY RECEIVED:",
      req.body ? Object.keys(req.body) : "NO_BODY"
    );

    if (!req.body) {
      return res.status(400).json({ error: "Request body not received" });
    }

    const { fileName, mimeType, base64 } = req.body;

    if (!fileName || !mimeType || !base64) {
      return res.status(400).json({
        error: "fileName, mimeType and base64 are required",
      });
    }

    const dataUri = `data:${mimeType};base64,${base64}`;
    const isPdf = mimeType === "application/pdf";

    const safeName = sanitizeFileName(fileName);

    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: isPdf ? "raw" : "image",
      folder: "tcc-leaves",
      public_id: isPdf ? `${safeName}.pdf` : safeName,
      use_filename: false,
      unique_filename: true,
      overwrite: false,
    });

    const finalUrl = result.secure_url;

    return res.json({
      url: finalUrl,
      original_name: fileName,
      type: mimeType,
    });
  } catch (error) {
    console.log("UPLOAD BASE64 ERROR:", error);
    return res.status(500).json({
      error: error.message || "Upload failed",
    });
  }
});

module.exports = router;