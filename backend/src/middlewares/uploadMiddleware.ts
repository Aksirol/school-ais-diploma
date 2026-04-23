import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Створюємо папку для завантажень, якщо її не існує
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Унікальне ім'я файлу: timestamp + випадкове число + оригінальне розширення
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Фільтр MIME-типів
const fileFilter = (req: any, file: any, cb: any) => {
  // 1. Допустимі MIME-типи
  const allowedMimeTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'application/vnd.ms-powerpoint', 
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', 
    'video/mp4', 'image/jpeg', 'image/png'
  ];
  
  // 2. Допустимі розширення файлів
  const allowedExtensions = /pdf|doc|docx|ppt|pptx|mp4|jpg|jpeg|png/;

  // Перевіряємо обидва параметри
  const isMimeValid = allowedMimeTypes.includes(file.mimetype);
  const isExtensionValid = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  if (isMimeValid && isExtensionValid) {
    return cb(null, true);
  }
  
  cb(new Error('Неприпустимий формат файлу. Або розширення не співпадає з типом контенту.'), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // Максимальний розмір 100 МБ (для відео)
  }
});