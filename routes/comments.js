const express = require("express");
const router = express.Router();
const { Crews, Comments, Boats, sequelize } = require("../models");
const authJwt = require("../middlewares/authMiddleware");
const loginMiddleware = require("../middlewares/loginMiddleware");

/* 0. 댓글 목록 조회
    @ 토큰 검사
    @ 시간 순서에 맞춰 comment 조회 */
router.get("/boat/:boatId/comment", async (req, res) => {
  try {
    // params
    const { boatId } = req.params;

    // 글에 해당하는 댓글 조회
    const comments = await Comments.findAll({
      attributes: [
        "commentId",
        "userId",
        [sequelize.col("nickName"), "nickName"],
        "comment",
        "createdAt",
      ],
      where: { boatId, deletedAt: null },
      include: [
        {
          model: Users,
          attributes: [],
        },
      ],
      raw: true,
    });

    // 조회된게 없을 경우
    if (!comments) {
      return res.status(202).json({ comments: [] });
    }

    // 조회된 결과
    return res.status(200).json({ comments });
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ errorMessage: "댓글 목록 조회 실패. 요청이 올바르지 않습니다." });
  }
});

/* 1. 댓글 작성
     @ 토큰을 검사하여 접근 권한이 있는지 확인
     @ comment 작성 */
router.post("/boat/:boatId/comment", authJwt, async (req, res) => {
  try {
    // crew 확인
    const { userId, nickName } = res.locals.user;
    // params로 boatId
    const { boatId } = req.params;
    // body로 comment 내용
    const { comment } = req.body;

    // boatId를 통해 글 조회
    const boat = await Boats.findOne({ where: { boatId } });
    // 글이 없을 경우
    if (!boat) {
      return res
        .status(404)
        .json({ errorMessage: "모집 글이 존재하지 않습니다." });
    }

    // captain일 경우 댓글 작성가능
    const captain = boat.captain;
    if (nickName === captain) {
      await Comments.create({ comment, boatId, userId });
      return res.status(200).json({ message: "댓글 작성 완료." });
    }

    // Crew인지 확인하기
    const isExistCrew = await Crews.findOne({ where: { boatId, userId } });
    if (!isExistCrew) {
      return res.status(401).json({
        errorMessage: "모임에 참가하지 않아 댓글 작성 권한이 없습니다.",
      });
    } else {
      // 작성 내용 확인
      if (comment < 1) {
        return res
          .status(412)
          .json({ errorMessage: "작성한 내용이 없습니다." });
      }

      // boatId에 맞춰서 댓글 작성
      await Comments.create({ comment, boatId, userId });

      // 댓글 작성 완료
      return res.status(200).json({ message: "댓글 작성 완료." });
    }
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ errorMessage: "댓글 작성 실패. 요청이 올바르지 않습니다." });
  }
});

/* 2. 댓글 수정
   @ 토큰을 검사해서 작성자만 수정 가능
   @ comment 작성 */
router.put("/boat/:boatId/comment/:commentId", authJwt, async (req, res) => {
  try {
    // user
    const { userId } = res.locals.user;
    // boatId, commentId를 params로
    const { boatId, commentId } = req.params;
    // 수정한 comment
    const { comment } = req.body;

    // boatId와 commentId를 동시에 조회
    const boatAndComment = await Boats.findOne({
      where: { boatId },
      include: [
        {
          model: Comments,
          where: { commentId },
        },
      ],
    });

    const boat = boatAndComment; // Boats 모델
    const isExistComment = boatAndComment.Comments[0]; // Comments 모델

    // 모집 글 확인
    if (!boat) {
      return res.status(404).json({ errorMessage: "crew 모집 글 조회 실패." });
    }

    // comment 글 확인
    if (!isExistComment) {
      return res
        .status(404)
        .json({ errorMessage: "존재하지 않는 댓글입니다." });
    }

    // comment 수정
    const updateCount = await Comments.update(
      { comment },
      { where: { commentId, boatId, userId } }
    );

    if (updateCount < 1) {
      return res
        .status(404)
        .json({ errorMessage: "댓글 수정이 정상적으로 처리되지 않았습니다." });
    }

    // 댓글 수정 완료
    return res.status(200).json({ message: "댓글을 수정하였습니다." });
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ errorMessage: "댓글 수정 실패. 요청이 올바르지 않습니다." });
  }
});

/* 3. 댓글 삭제
   @ 토큰을 검사하여 권한 확인하기 */
router.patch("/boat/:boatId/comment/:commentId", authJwt, async (req, res) => {
  try {
    // user 확인
    const { userId } = res.locals.user;
    // boatId, commentId를 params로
    const { boatId, commentId } = req.params;
    // deletedAt를 body로
    const { deletedAt } = req.body;

    // 모집 글 확인
    const boat = await Boats.findOne({ where: { boatId } });
    if (!boat) {
      return res
        .status(404)
        .json({ errorMessage: "존재하지 않는 모집 글입니다." });
    }

    // comment 글 확인
    const comment = await Comments.findByPk(commentId);
    if (!comment) {
      return res
        .status(404)
        .json({ errorMessage: "존재하지 않는 댓글입니다." });
    }
    // comment 권한 확인
    if (userId !== comment.userId) {
      return res
        .status(401)
        .json({ errorMessage: "댓글 삭제 권한이 없습니다." });
    }

    // deletedAt 확인
    if (deletedAt === undefined) {
      return res
        .status(412)
        .json({ errorMessage: "삭제 요청이 올바르지 않습니다." });
    } else {
      boat.deleteAt = deletedAt;
    }
    // 댓글 삭제
    const deleteCount = await Comments.update(
      { deletedAt },
      { where: { commentId, boatId, userId } }
    );
    if (!deleteCount) {
      return res.status(404).json({ errorMessage: "삭제한 댓글이 없습니다." });
    }

    // 댓글 삭제 완료
    return res.status(200).json({ message: "댓글 삭제 완료." });
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ errorMessage: "댓글 삭제 실패. 요청이 올바르지 않습니다." });
  }
});

module.exports = router;
