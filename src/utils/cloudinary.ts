import {
  type UploadApiErrorResponse,
  type UploadApiResponse,
  type DeleteApiResponse,
} from "cloudinary";
import { v2 as cloudinary } from "cloudinary";

const normalizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  if (typeof error === "string") {
    return error;
  }

  return JSON.stringify(error);
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadSingleToCloudinary = async (
  file: Express.Multer.File,
  folder = "test_uploads"
): Promise<UploadApiResponse> =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
        if (error) {
          return reject(
            new Error(
              `Cloudinary upload failed: ${normalizeErrorMessage(error)}`
            )
          );
        }

        if (!result) {
          return reject(
            new Error("Cloudinary upload returned an empty result")
          );
        }

        resolve(result);
        return result;
      }
    );
    uploadStream.end(file.buffer);
  });

export const uploadMultipleToCloudinary = async (
  files: Express.Multer.File[],
  folder = "test_uploads"
): Promise<UploadApiResponse[]> => {
  const uploadPromises = files.map((file) =>
    uploadSingleToCloudinary(file, folder)
  );
  return Promise.all(uploadPromises);
};

export const deleteSingleFromCloudinary = async (
  publicId: string
): Promise<UploadApiResponse> => {
  try {
    const result = (await cloudinary.uploader.destroy(
      publicId
    )) as UploadApiResponse;
    return result;
  } catch (error) {
    throw new Error(`Failed to delete image: ${normalizeErrorMessage(error)}`);
  }
};

export const deleteMultipleFromCloudinary = async (
  publicIds: string[]
): Promise<DeleteApiResponse> => {
  try {
    const result = (await cloudinary.api.delete_resources(
      publicIds
    )) as DeleteApiResponse;
    return result;
  } catch (error) {
    throw new Error(`Failed to delete images: ${normalizeErrorMessage(error)}`);
  }
};
