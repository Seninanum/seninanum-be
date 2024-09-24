const express = require("express");
const multer = require("multer");
const router = express.Router();
const nodemailer = require("nodemailer");
const pool = require("../../database/db");

const upload = multer();

router.post(
  "/",
  upload.fields([{ name: "pdfFile" }, { name: "profileId" }]),
  async (req, res) => {
    /**
    #swagger.tags = ['CareerCertificate']
    #swagger.summary = '경력 증명서 전송'
   */

    const file = req.files["pdfFile"] ? req.files["pdfFile"][0] : null; // multer가 처리한 파일 정보
    const profileId = req.body.profileId; // 텍스트 필드에서 profileId 가져오기

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
      text: `시니어의 경력 증명서 파일이 수신되었습니다. Profile ID: ${profileId}`,
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
      //db에 파일 이름, 상태 저장
      await pool.query(
        "UPDATE careerProfile SET certificateName = ?, certificate = ? WHERE profileId = ?",
        [fileName, "PENDING", profileId]
      );

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
  }
);

router.delete("/", async (req, res) => {
  /**
    #swagger.tags = ['CareerCertificate']
    #swagger.summary = '경력 증명서 삭제'
   */
  const profileId = req.body.profileId;
  try {
    const result = await pool.query(
      "UPDATE careerProfile SET certificateName = ?, certificate = ? WHERE profileId = ?",
      ["", "DEFAULT", profileId]
    );
    console.log("Rows affected:", result[0].affectedRows);
    res.status(200).json({ message: "경력 증명서가 삭제되었습니다." });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the careerItem" });
  }
});

// router.patch("/", async (req, res) => {
//   /**
//     #swagger.tags = ['CareerCertificate']
//     #swagger.summary = '경력 증명서 상태 수정'
//    */

//   const profileId = req.body.profileId;
//   const result = req.body.result;
//   try {
//     const result = await pool.query(
//       "UPDATE careerProfile SET certificate = ? WHERE profileId = ?",
//       [result, profileId]
//     );
//     console.log("Rows affected:", result[0].affectedRows);
//     res.status(200).json({ message: "경력 증명서가 업데이트되었습니다." });
//   } catch (error) {
//     console.log(error);
//     res
//       .status(500)
//       .json({ error: "An error occurred while deleting the careerItem" });
//   }
// });

module.exports = router;
