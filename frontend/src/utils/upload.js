import axios from 'axios';

// Dùng instance axios chung nếu dự án có cấu hình (baseURL, interceptors)
// import axiosInstance from './axiosInstance'; 

/**
 * Upload một file lên hệ thống (thông qua API Backend)
 * Backend sẽ nhận file, upload lên Cloudinary và trả về URL
 * 
 * @param {File} file - Đối tượng File từ thẻ input type="file"
 * @param {string} token - JWT token để xác thực với backend (nếu có)
 * @returns {Promise<{ url: string, public_id: string }>}
 */
export const uploadFile = async (file, token = null) => {
  if (!file) {
    throw new Error('Chưa chọn file để upload');
  }

  // Khởi tạo FormData
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Cấu hình headers
    const headers = {
      'Content-Type': 'multipart/form-data',
    };

    // Lấy token từ localStorage nếu không truyền vào (hoặc theo logic auth của dự án)
    const authToken = token || localStorage.getItem('token');
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Đổi URL endpoint sao cho phù hợp với cấu hình (vd: axiosInstance.post('/upload', ...))
    const response = await axios.post('http://localhost:5000/api/upload', formData, {
      headers,
    });

    if (response.data && response.data.success) {
      // Trả về { url, public_id }
      return {
        url: response.data.url,
        public_id: response.data.public_id
      };
    } else {
      throw new Error(response.data?.message || 'Lỗi khi upload file');
    }
  } catch (error) {
    console.error('Upload error in frontend:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Lỗi kết nối khi upload';
    throw new Error(errorMessage);
  }
};
