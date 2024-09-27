const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.post("/", async (req, res) => {
  /**
    #swagger.tags = ['CareerItem']
    #swagger.summary = '경력 상세 사항 등록'
    #swagger.parameters = [
      {
        name: 'body',
        in: 'body',
        required: true,
        schema: {
          title: "제목",
          startYear: 1989,
          startMonth: 12,
          endYear: 2023,
          endMonth: 12,
          content: "내용을 입력합니다.",
        },
      }
    ]
   */

  const {
    profileId,
    title,
    startYear,
    startMonth,
    endYear,
    endMonth,
    content,
  } = req.body;
  if (
    !profileId ||
    !title ||
    !startYear ||
    !startMonth ||
    !endYear ||
    !endMonth ||
    !content
  ) {
    return res.status(400).json({ error: "값이 존재해야 합니다." });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO careerItem (profileId, title, startYear, startMonth, endYear, endMonth, content) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [profileId, title, startYear, startMonth, endYear, endMonth, content]
    );

    res.status(200).json({ message: "경력 항목이 추가되었습니다." }); // 새 경력 항목
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the careerItem" });
  }
});

router.delete("/:careerId", async (req, res) => {
  /**
    #swagger.tags = ['CareerItem']
    #swagger.summary = '경력 상세 사항 삭제'
    #swagger.parameters = [
      {
        name: 'body',
        in: 'body',
        required: true,
        schema: {
          careerId: 1,
        },
      }
    ]
   */

  const careerId = req.params.profileId;

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

router.get("/list/:profileId", async (req, res) => {
  /**
   * #swagger.tags = ['CareerItem']
   * #swagger.summary = '경력 상세 사항 리스트 조회'
   */

  const profileId = req.params.profileId;
  try {
    const [results] = await pool.query(
      "SELECT careerId, title, startYear, startMonth, endYear, endMonth, content FROM careerItem where profileId = ?",
      [profileId]
    );
    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the career items" });
  }
});

module.exports = router;
