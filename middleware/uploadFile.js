const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const Storage = (PARENT_DESTINATION, SUB_DESTINATION) => {
    const DESTINATION_NEW = path.join(PARENT_DESTINATION, SUB_DESTINATION);
    return multer.diskStorage({
        destination: (_req, _file, callback) => {
            if (!fs.existsSync(DESTINATION_NEW)) {
                fs.mkdirSync(DESTINATION_NEW, { recursive: true });
            }
            callback(null, DESTINATION_NEW);
        },
        filename: (_req, file, callback) => {
            const filename = uuidv4();
            const ext = path.extname(file.originalname);
            callback(null, filename + '_' + Date.now() + ext);
        },
    });
};

const uploadMaterial = multer({
    storage: Storage('uploads', ''),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedExt = /\.(docx|txt|html|css|js|py|pdf|xlsx|xlsm|csv|ppt|pptx|ico|jpg|jpeg|png|gif|svg|webp|tiff|psd|raw|bmp|heif|jfif|indd|zip|log|tbw|tar|bz2|rtf|rar|rar4)$/i;
        if (!allowedExt.test(file.originalname)) {
            return cb(new Error('Unsupported file type'), false);
        }
        cb(null, true);
    },
});

module.exports = {
    uploadMaterial
};
