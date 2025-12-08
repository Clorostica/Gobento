import { generateReactHelpers } from "@uploadthing/react";
import type { FileRouter } from "uploadthing/types";
import { env } from "../config/env";

// Generate upload helpers pointing to our backend route handler
// The backend generates presigned URLs, then files upload directly from client to UploadThing
// Using 'any' for FileRouter since we can't import the exact type from JS backend
const { uploadFiles } = generateReactHelpers<FileRouter>({
  url: `${env.API_URL}/api/uploadthing`,
});

/**
 * Upload a file to uploadthing using client-side uploads
 * The backend generates presigned URLs, then the file uploads directly from client to UploadThing
 * @param file - The file to upload
 * @returns Promise resolving to the uploaded file URL
 */
export const uploadFile = async (file: File): Promise<string> => {
  try {
    console.log(`Uploading ${file.name}...`);

    // Upload files - backend generates presigned URLs, then client uploads directly to UploadThing
    const response = await uploadFiles("imageUploader" as any, {
      files: [file],
      onUploadBegin: ({ file: fileName }: { file: string }) => {
        console.log(`Starting upload for ${fileName}...`);
      },
      onUploadProgress: ({ progress }: { progress: number }) => {
        console.log(`Upload progress: ${progress}%`);
      },
    });

    if (!response || response.length === 0) {
      throw new Error("Upload failed: No response from uploadthing");
    }

    const uploadedFile = response[0];
    if (!uploadedFile) {
      throw new Error("Upload failed: No file in response");
    }

    const fileUrl = uploadedFile.ufsUrl || uploadedFile.url; // Use ufsUrl, fallback to url for backward compatibility

    // Console.log the URL as requested
    console.log("Image uploaded successfully. Download URL:", fileUrl);

    return fileUrl;
  } catch (error) {
    console.error("Error uploading file to uploadthing:", error);
    throw error;
  }
};

/**
 * Upload multiple files to uploadthing using client-side uploads
 * The backend generates presigned URLs, then files upload directly from client to UploadThing
 * @param files - Array of files to upload
 * @param onProgress - Optional callback to track upload progress (0-100)
 * @returns Promise resolving to an array of uploaded file URLs
 */
export const uploadMultipleFiles = async (
  files: File[],
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  try {
    console.log(`Uploading ${files.length} file(s)...`);

    // Upload files - backend generates presigned URLs, then client uploads directly to UploadThing
    const response = await uploadFiles("imageUploader" as any, {
      files: files,
      onUploadBegin: ({ file: fileName }: { file: string }) => {
        console.log(`Starting upload for ${fileName}...`);
        onProgress?.(0);
      },
      onUploadProgress: ({ progress }: { progress: number }) => {
        console.log(`Upload progress: ${progress}%`);
        onProgress?.(progress);
      },
    });

    if (!response || response.length === 0) {
      throw new Error("Upload failed: No response from uploadthing");
    }

    const urls = response.map((file) => file.ufsUrl || file.url); // Use ufsUrl, fallback to url for backward compatibility

    // Console.log all URLs as requested
    console.log("Images uploaded successfully. Download URLs:", urls);

    onProgress?.(100);
    return urls;
  } catch (error) {
    console.error("Error uploading files to uploadthing:", error);
    onProgress?.(0);
    throw error;
  }
};
