const express = require("express");
const multer = require("multer");
const router = express.Router();
const nodemailer = require("nodemailer");

const upload = multer();

router.post("/certificate", upload.single("pdfFile"), async (req, res) => {
  /**
    #swagger.tags = ['Career']
    #swagger.summary = '경력 증명서 전송'
   */
  const file = req.file; // multer가 처리한 파일 정보
  if (!file) {
    return res.status(400).json({ message: "PDF 파일이 없습니다." });
  }

  const pdfBuffer = file.buffer; // 파일 내용을 Buffer로 가져옴
  const fileName = file.originalname; // 원본 파일 이름

  // Nodemailer 설정
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // 이메일 옵션 설정
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: "경력 증명서 전송",
    text: "시니어의 경력 증명서 파일이 수신되었습니다.",
    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    return res
      .status(200)
      .json({ message: "이메일이 성공적으로 전송되었습니다." });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      message: "이메일 전송 실패",
      error: error.message,
    });
  }
});

module.exports = router;
