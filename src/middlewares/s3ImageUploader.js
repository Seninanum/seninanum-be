const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
const path = require("path");

// AWS S3 설정
const s3 = new S3Client({
  region: "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 허용되는 파일 확장자
const allowedExtensions = [".png", ".jpg", ".jpeg", ".bmp", ".heic"];

// Multer S3 스토리지 설정
const imageUploader = multer({
  storage: multerS3({
    s3: s3,
    bucket: "seni-source",
    key: (req, file, callback) => {
      const uploadDirectory = req.query.directory ?? "";
      const extension = path.extname(file.originalname);
      if (!allowedExtensions.includes(extension)) {
        console.error("허용되지 않는 파일 확장자:", extension);
        return callback(new Error("wrong extension"));
      }
      const fileName = `${uploadDirectory}/${Date.now()}_${file.originalname}`;
      console.log("S3에 업로드할 파일 이름:", fileName);
      callback(null, fileName);
    },
    acl: "public-read-write",
  }),
});

module.exports = imageUploader;
