const express = require("express");
const router = express.Router();
const authJwt = require("../middlewares/authMiddleware");
const { Users, Boats, Crews } = require("../models");

/* mypage API
토큰을 검사하여 userId에 맞게 모집 글, 참여 글 불러오기 */
router.get("/mypage", authJwt, async (req, res) => {
  try {
    // user 정보
    const { userId } = res.locals.user;
    const user = await Users.findOne({
      where: { userId },
      raw: true,
    });

    // userId에 맞춰 작성한 글 가져오기
    const writedBoatsPromise = Boats.findAll({
      attributes: ["boatId", "captain", "title", "createdAt", "isDone"],
      where: { userId, deletedAt: null },
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    // crews 테이블에서 참여한 boatId 찾기
    const attendedBoatsDataPromise = Crews.findAll({
      attributes: ["boatId"],
      where: { userId, isReleased: false },
      raw: true,
    });

    const [writedBoats, attendedBoatsData] = await Promise.all([
      writedBoatsPromise,
      attendedBoatsDataPromise,
    ]);

    const attendedBoats = [];

    for (let i = 0; i < attendedBoatsData.length; i++) {
      const boatId = attendedBoatsData[i].boatId;

      const boatPromise = await Boats.findOne({
        attributes: ["boatId", "captain", "title", "createdAt", "isDone"],
        where: { boatId, deletedAt: null },
        raw: true,
      });

      const boat = await boatPromise;

      if (boat) {
        attendedBoats.push(boat);
      }
    }

    return res.status(200).json({
      user,
      writedBoats,
      attendedBoats: attendedBoats,
    });
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      errorMessage: "Mypage를 불러오지 못했습니다. 요청이 올바르지 않습니다.",
    });
  }
});

module.exports = router;
