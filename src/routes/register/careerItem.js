const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.post("/", async (req, res) => {
  /**
    #swagger.tags = ['CareerItem']
    #swagger.summary = '경력 상세 사항 등록'
    #swagger.description = '경력 프로필에 등록하는 경력 상세 사항'
    #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                  "type": "object",
                    properties: {
                      title: { type: 'string', description: '경력 제목' },
                      startYear: { type: 'integer', description: '경력 시작 연도' },
                      startMonth: { type: 'integer', description: '경력 시작 월' },
                      endYear: { type: 'integer', description: '경력 종료 연도' },
                      endMonth: { type: 'integer', description: '경력 종료 월' },
                      content: { type: 'string', description: '경력 상세 내용' }
                    },
                    required: ['title', 'startYear', 'startMonth', 'endYear', 'endMonth', 'content']
                },
                example: {
                    "title": "경력 제목",
                    "startYear": 1993,
                    "startMonth": 12,
                    "endYear": 2023,
                    "endMonth": 12,
                    "content": "장애 아동 사회복지사",
                },
            },
        }
    }
   */
  const { title, startYear, startMonth, endYear, endMonth, content } = req.body;
  if (
    !title ||
    !startYear ||
    !startMonth ||
    !endYear ||
    !endMonth ||
    !content
  ) {
    return res.status(400).json({ error: "값이 존재해야 합니다." });
  }
  const userId = req.user.userId;

  try {
    const [user] = await pool.query("SELECT * FROM user WHERE userId = ?", [
      userId,
    ]);
    if (user.length === 0) {
      return res.status(400).json({ error: "유효하지 않은 userId입니다." });
    }

    const [result] = await pool.query(
      "INSERT INTO careerItem (userId, title, startYear, startMonth, endYear, endMonth, content) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, title, startYear, startMonth, endYear, endMonth, content]
    );
    const [newCareer] = await pool.query(
      "SELECT * FROM careerItem WHERE careerId = ?",
      [result.insertId]
    );
    res.status(201).json({ career: newCareer[0] }); // 새 경력 항목
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the careerItem" });
  }
});

router.delete("/", async (req, res) => {
  /**
    #swagger.tags = ['CareerItem']
    #swagger.summary = '경력 상세 사항 삭제'
    #swagger.description = '경력 프로필에 등록하는 경력 상세 사항'
    #swagger.requestBody = {
        required: true,
        content: {
            "application/json": {
                schema: {
                  "type": "object",
                    properties: {
                      careerId: { type: 'integer', description: '경력 항목 아이디' },
                    },
                    required: ['careerId']
                },
            },
        }
    }
   */
  const { careerId } = req.body;

  try {
    const [result] = await pool.query(
      "DELETE FROM careerItem WHERE careerId = ?",
      [careerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "경력 항목을 찾을 수 없습니다." });
    }

    res.status(200).json({ message: "경력 항목이 삭제되었습니다." });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the careerItem" });
  }
});

router.get("/list", async (req, res) => {
  /**
   * #swagger.tags = ['CareerItem']
   * #swagger.summary = '경력 상세 사항 조회'
   * #swagger.description = '경력 프로필에 등록하는 경력 상세 사항'
   */
  try {
    const [results] = await pool.query("SELECT * FROM careerItem");
    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the career items" });
  }
});

module.exports = router;
