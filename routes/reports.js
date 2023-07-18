const express = require("express");
const { Reports } = require("../models");
const router = express.Router();

/* 1. 신고 접수 API
     @ 토큰을 검사하여, 유효한 토큰일 경우에만 신고
     @ reportContent */
router.post("/report/:boatId", async (req, res) => {
  try {
    // params
    const { boatId } = req.params;
    // req.body로 작성 내용 받기
    const { reportContent } = req.body;

    // 작성 내용 확인
    if (reportContent < 1) {
      return res
        .status(412)
        .json({ errorMessage: "reportContent에 작성된 내용이 없습니다." });
    }

    // report 작성
    await Reports.create({
      boatId,
      reportContent,
    });
    return res.status(200).json({ message: "report 작성 완료" });
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ errorMessage: "글 신고 작성 실패. 요청이 올바르지 않습니다." });
  }
});

router.post("/report/:boatId/:commentId", async (req, res) => {
  try {
    // params
    const { boatId, commentId } = req.params;
    // body
    const { reportContent } = req.body;

    // 작성 내용 확인
    if (reportContent < 1) {
      return res
        .status(412)
        .json({ errorMessage: "reportContent에 작성된 내용이 없습니다." });
    }

    // report 작성
    await Reports.create({
      boatId,
      commentId,
      reportContent,
    });
    return res.status(200).json({ message: "report 작성 완료" });
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ errorMessage: "댓글 신고 작성 실패. 요청이 올바르지 않습니다." });
  }
});

module.exports = router;
