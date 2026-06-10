import cloudinary from '../config/cloudinary';
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

/**
 * Tải một file buffer lên Cloudinary
 * @param fileBuffer Dữ liệu file dưới dạng buffer
 * @param mimetype Định dạng file (VD: image/png, application/pdf)
 * @returns { url, public_id }
 */
export const uploadToCloudinary = (fileBuffer: Buffer, mimetype: string): Promise<{ url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    // Nếu là file tài liệu (pdf, doc, v.v.), Cloudinary yêu cầu resource_type là 'raw' hoặc 'auto'
    // Để an toàn và hỗ trợ cả raw file, ta có thể set resource_type: 'auto'
    const isImage = mimetype.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: 'pbl5-uploads', // Bạn có thể cấu hình thư mục trên Cloudinary ở đây
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          return reject(error || new Error('Upload to Cloudinary failed'));
        }
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};
