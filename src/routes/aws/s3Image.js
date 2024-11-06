const express = require("express");
const imageUploader = require("../../middlewares/s3ImageUploader");
const router = express.Router();

// 이미지 업로드 API
router.post("/image", imageUploader.single("image"), (req, res) => {
  /**
      #swagger.tags = ['Image']
      #swagger.summary = '이미지 업로드'
   */

  // S3에 업로드된 이미지 URL을 가져옵니다
  const s3Link = req.file
    ? `https://seni-source.s3.ap-northeast-2.amazonaws.com/${req.file.key}`
    : null;

  if (!s3Link) {
    return res.status(400).json({ error: "이미지 업로드 실패" });
  }

  res.status(200).json(s3Link);
});

module.exports = router;
