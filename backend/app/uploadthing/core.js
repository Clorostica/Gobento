import { createUploadthing } from "uploadthing/express";

const f = createUploadthing({
  token: process.env.UPLOADTHING_TOKEN,
});

export const uploadRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 10,
    },
  }).onUploadComplete(({ file }) => {
    console.log("Upload complete. File URL:", file.ufsUrl);
  }),
};
