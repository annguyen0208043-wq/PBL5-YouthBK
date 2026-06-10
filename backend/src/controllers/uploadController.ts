import { Request, Response } from 'express';
import { uploadToCloudinary } from '../services/uploadService';

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Không tìm thấy file' });
      return;
    }

    const fileBuffer = req.file.buffer;
    const mimetype = req.file.mimetype;

    const result = await uploadToCloudinary(fileBuffer, mimetype);

    res.status(200).json({
      success: true,
      url: result.url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi upload file' });
  }
};
