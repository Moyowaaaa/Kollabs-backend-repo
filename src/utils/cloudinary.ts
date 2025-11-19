import { UploadApiResponse } from "cloudinary";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadSingleToCloudinary = async (
  file: Express.Multer.File,
  folder = "test_uploads"
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result as UploadApiResponse);
        return result;
      }
    );
    uploadStream.end(file.buffer);
  });
};

export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder = "test_uploads"
): Promise<UploadApiResponse[]> => {
  const uploadPromises = files.map((file) =>
    uploadSingleToCloudinary(file, folder)
  );
  return Promise.all(uploadPromises);
};

export const deleteSingleFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Failed to delete image: ${error}`);
  }
};

export const deleteMultipleFromCloudinary = async (publicIds: string[]) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    throw new Error(`Failed to delete images: ${error}`);
  }
};
