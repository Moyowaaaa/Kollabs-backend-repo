import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";

/**
 * =============================================================================
 * 🐴 MULTER SERVICE - Explained Like You're a Donkey (No Offense!)
 * =============================================================================
 *
 * WHAT IS MULTER?
 * ---------------
 * Imagine you're a mail carrier (Express.js), and someone wants to send you
 * a package (an image file). But you only know how to read letters (JSON/text).
 * Multer is like a special helper that opens packages for you and hands you
 * what's inside.
 *
 * In technical terms: Express can't handle file uploads by itself.
 * Multer is "middleware" that processes file uploads and gives you access
 * to the file data.
 *
 * HOW DOES IT WORK?
 * -----------------
 * 1. User sends a file (e.g., profile picture)
 * 2. Multer catches it BEFORE your controller code runs
 * 3. Multer stores it in memory (RAM) as a "buffer" (raw bytes)
 * 4. Your controller gets the file in `req.file` or `req.files`
 * 5. You then send this buffer to Cloudinary (which you already have!)
 *
 * WHY MEMORY STORAGE?
 * -------------------
 * We use "memoryStorage" because we don't want to save files to our server.
 * We just want to temporarily hold them, then send them to Cloudinary.
 * Think of it like holding a package just long enough to forward it somewhere else.
 *
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// CONFIGURATION: What types of files do we accept?
// -----------------------------------------------------------------------------

/**
 * Allowed image types. If someone tries to upload a .exe or .pdf, we reject it!
 */
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg", // .jpg, .jpeg
  "image/png", // .png
  "image/gif", // .gif
  "image/webp", // .webp (modern, efficient format)
  "image/svg+xml", // .svg
];

/**
 * Maximum file size in bytes.
 * 5 * 1024 * 1024 = 5MB (5 megabytes)
 *
 * Why 5MB? It's a good balance between allowing high-quality images
 * and preventing someone from uploading a 500MB file and crashing your server.
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// -----------------------------------------------------------------------------
// FILE FILTER: The bouncer at the door 🚪
// -----------------------------------------------------------------------------

/**
 * This function checks if the uploaded file is allowed.
 * Think of it as a bouncer at a club checking IDs.
 *
 * @param _req - The request object (we don't use it, hence the underscore)
 * @param file - The file that was uploaded
 * @param callback - A function we call to say "yes" or "no"
 */
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  // Check if the file's mimetype is in our allowed list
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    // ✅ File is allowed! Let it through.
    callback(null, true);
  } else {
    // ❌ File type not allowed! Reject it with an error message.
    callback(
      new Error(
        `Invalid file type: ${
          file.mimetype
        }. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`
      )
    );
  }
};

// -----------------------------------------------------------------------------
// MULTER INSTANCE: The main upload handler 📤
// -----------------------------------------------------------------------------

/**
 * This is the multer instance configured for image uploads.
 *
 * HOW TO USE:
 * -----------
 * In your route, use it like this:
 *
 *   // For a SINGLE image (field name = "image"):
 *   router.post("/upload", uploadImage.single("image"), yourController);
 *
 *   // For MULTIPLE images (field name = "images", max 5 files):
 *   router.post("/upload-many", uploadImage.array("images", 5), yourController);
 *
 * THEN IN YOUR CONTROLLER:
 * ------------------------
 *   // Single file:
 *   const file = req.file; // This is the uploaded file!
 *
 *   // Multiple files:
 *   const files = req.files; // This is an array of uploaded files!
 *
 *   // Now send to Cloudinary:
 *   const result = await uploadSingleToCloudinary(file, "my_folder");
 */
export const uploadImage = multer({
  // Where to store the file? In memory (RAM), not on disk.
  storage: multer.memoryStorage(),

  // Maximum file size allowed
  limits: {
    fileSize: MAX_FILE_SIZE,
  },

  // The bouncer function that checks file types
  fileFilter: imageFileFilter,
});

// -----------------------------------------------------------------------------
// CONVENIENCE EXPORTS: Pre-configured middleware for common use cases
// -----------------------------------------------------------------------------

/**
 * Middleware for uploading a SINGLE image.
 * The field name in your form/request MUST be "image".
 *
 * Example usage in routes:
 *   router.post("/profile-picture", singleImageUpload, updateProfilePicture);
 *
 * Then in your controller, access it via: req.file
 */
export const singleImageUpload = uploadImage.single("image");

/**
 * Middleware for uploading MULTIPLE images (up to 10).
 * The field name in your form/request MUST be "images".
 *
 * Example usage in routes:
 *   router.post("/gallery", multipleImageUpload, uploadToGallery);
 *
 * Then in your controller, access them via: req.files
 */
export const multipleImageUpload = uploadImage.array("images", 10);

// -----------------------------------------------------------------------------
// 📚 QUICK REFERENCE CHEAT SHEET
// -----------------------------------------------------------------------------
/**
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                         HOW TO USE THIS FILE                            │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │  STEP 1: Import in your route file                                      │
 * │  ─────────────────────────────────────────────                          │
 * │  import { singleImageUpload } from "../utils/multer";                   │
 * │                                                                         │
 * │  STEP 2: Use as middleware in your route                                │
 * │  ─────────────────────────────────────────────                          │
 * │  router.post("/upload", singleImageUpload, uploadController);           │
 * │                                                                         │
 * │  STEP 3: Access the file in your controller                             │
 * │  ─────────────────────────────────────────────                          │
 * │  const file = req.file;  // <-- Multer puts the file here!              │
 * │                                                                         │
 * │  STEP 4: Send to Cloudinary                                             │
 * │  ─────────────────────────────────────────────                          │
 * │  import { uploadSingleToCloudinary } from "../utils/cloudinary";        │
 * │  const result = await uploadSingleToCloudinary(file, "folder_name");    │
 * │  const imageUrl = result.secure_url; // <-- This is your image URL!     │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 */
