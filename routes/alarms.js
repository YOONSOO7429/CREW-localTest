const express = require("express");
const router = express.Router();
const authJwt = require("../middlewares/authMiddleware");
const loginMiddleware = require("../middlewares/loginMiddleware"); // 로그인한 회원 확인을 위한 middleware
const {
  sequelize,
  Users,
  Boats,
  Crews,
  Alarms,
  Comments,
} = require("../models");

/* 0. 회원에 해당하는 알림 목록 조회 API
   @ 로그인한 회원을 확인
   @ Alarms 테이블을 통해 확인하기 */
router.get("/alarm", loginMiddleware, async (req, res) => {
  try {
    // userId 확인
    const userId = res.locals.user ? res.locals.user.userId : null;

    if (userId === null) {
      return res.status(200).json({ message: "게스트 입니다." });
    }
    // user 정보에 맞춰 알람 호출 해주기
    if (userId) {
      const alarms = await Alarms.findAll({
        attributes: ["alarmId", "isRead", "message"],
        where: { userId, isRead: false },
        raw: true,
      });

      // alarms 없을 경우
      if (!alarms || alarms.length === 0) {
        return res
          .status(404)
          .json({ errorMessage: "조회된 알림이 없습니다." });
      }
      return res.status(200).json({ alarms });
    }
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ errorMessage: "알람 목록조회 실패. 요청이 올바르지 않습니다." });
  }
});

/* 1. 알림 읽음 API
    @ alarmId를 넘겨주면 그거에 해당하는 alarm을 isRead = true로 */
router.put("/alarm/:alarmId", authJwt, async (req, res) => {
  try {
    // user 정보
    const { userId } = res.locals.user;
    // params로 alarmId
    const { alarmId } = req.params;
    const alarm = await Alarms.findOne({ where: { alarmId, userId } });
    if (userId !== alarm.userId) {
      return res
        .status(401)
        .json({ errorMessage: "알림 읽음 처리. 권한이 없습니다." });
    }

    // alarmId에 해당하는 부분 isRead 처리
    const updateCount = await Alarms.update(
      { isRead: true },
      { where: { alarmId, userId } }
    );
    if (!updateCount) {
      return res.status(404).json({ errorMessage: "알림 읽기 처리 실패." });
    }
    return res.status(200).json({ message: "알림 읽음 처리 성공." });
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ errorMessage: "알림 읽음 처리 실패. 요청이 올바르지 않습니다." });
  }
});

/* 1. 참가하기 API
   @ 로그인한 회원을 확인
   @ 글의 maxCrewNum와 crewNum을 확인해서 참가 가능 여부 설정 */
router.post("/boat/:boatId/join", authJwt, async (req, res) => {
  try {
    // user 정보
    const { userId } = res.locals.user;
    const user = await Users.findOne({
      attributes: ["nickName"],
      where: { userId },
      raw: true,
    });
    // params로 boatId
    const { boatId } = req.params;

    // 글에서 maxCrewNum와 crewNum을 확인하기
    const boat = await Boats.findOne({
      attributes: [
        "userId",
        "boatId",
        "maxCrewNum",
        [
          sequelize.literal(
            `(SELECT COUNT(*) FROM Crews WHERE Boats.boatId = Crews.boatId) + 1`
          ),
          "crewNum",
        ],
      ],
      where: { boatId },
      raw: true,
    });

    // 글이 존재하지 않을 경우
    if (!boat) {
      return res.status(404).json({ errorMessage: "글이 존재하지 않습니다." });
    }

    if (boat.userId === userId) {
      return res
        .status(403)
        .json({ errorMessage: "본인이 작성한 글에는 참가할 수 없습니다." });
    }
    // 이미 참가한 사용자인지 확인
    const existingCrew = await Crews.findOne({
      where: { userId, boatId, isReleased: false },
      raw: true,
    });
    const isReleasedCrew = await Crews.findOne({
      where: { userId, boatId, isReleased: true },
      raw: true,
    });

    if (existingCrew) {
      return res.status(403).json({ errorMessage: "이미 참가한 글입니다." });
    }
    if (isReleasedCrew) {
      return res
        .status(401)
        .json({ errorMessage: "Captain의 권한으로 참가할 수 없습니다." });
    }

    // maxCrewNum, crewNum 숫자 비교
    if (boat.maxCrewNum > boat.crewNum) {
      await Crews.create({
        userId,
        boatId,
        nickName: user.nickName,
        isReleased: false,
      });
      await Alarms.create({
        userId: boat.userId,
        isRead: false,
        message: `${user.nickName}님이 모임에 참가했습니다.`,
      });
      return res.status(200).json({ message: "참가 성공." });
    } else {
      return res.status(203).json({ message: "모집이 마감되었습니다." });
    }
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ errorMessage: "참가 요청 실패. 요청이 올바르지 않습니다." });
  }
});

/* 2. 내보내기 API
   @ 토큰을 검사하여 권한을 확인
   @ 내보내면 Crews에서 isReleased를 true로 전환, Alarms를 이용해 알림 생성 */
router.post("/boat/:boatId/release", authJwt, async (req, res) => {
  try {
    // user 정보
    const { userId } = res.locals.user;
    // params로 boatId
    const { boatId } = req.params;
    const boat = await Boats.findOne({
      attributes: ["userId", "title"],
      where: { boatId },
      raw: true,
    });
    // body
    const { id } = req.body;

    // 글 확인
    if (!boat) {
      return res.status(404).json({ errorMessage: "글이 존재하지 않습니다." });
    }

    // 권한이 있는지 확인하기
    if (userId !== boat.userId) {
      return res
        .status(401)
        .json({ errorMessage: "모임 내보내기 권한이 없습니다." });
    }

    // boatId로 crew 조회
    const crew = await Crews.findOne({
      attributes: ["userId"],
      where: { boatId, userId: id },
      raw: true,
    });

    // crew 확인
    if (crew) {
      const updateCount = await Crews.update(
        { isReleased: true },
        { where: { boatId, userId: id } }
      );
      if (!updateCount) {
        return res.status(404).json({ errorMessage: "내보내기 실패." });
      } else {
        await Alarms.create({
          userId: crew.userId,
          isRead: false,
          message: `"${boat.title}" 모임에서 내보내졌습니다.`,
        });
        return res.status(200).json({ message: "내보내기 성공." });
      }
    } else {
      return res
        .status(412)
        .json({ errorMessage: `${nickName}님이 crew가 아닙니다.` });
    }
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ errorMessage: "내보내기 요청 실패. 요청이 올바르지 않습니다." });
  }
});

/* 3. 나가기 API
    @ 토큰을 검사하여 참여자 확인 후 나가기
    @ Crews에서 삭제, 나가기 알람 생성(Captain한테 보내기), comment는 deletedAt 업데이트 시키기*/
router.post("/boat/:boatId/exit", authJwt, async (req, res) => {
  try {
    //user 정보
    const { userId } = res.locals.user;
    const user = await Users.findOne({
      attributes: ["nickName"],
      where: { userId },
      raw: true,
    });
    // params로 boatId
    const { boatId } = req.params;

    // 글 확인
    const boat = await Boats.findOne({ where: { boatId } });
    if (!boat) {
      return res.status(404).json({ errorMessage: "글이 존재하지 않습니다." });
    }

    // Crew인지 확인
    const crew = await Crews.findOne({ where: { userId, boatId } });
    if (!crew) {
      return res.status(404).json({ errorMessage: "crew가 아닙니다." });
    }
    // Crews table에서 삭제
    const deleteCount = await Crews.destroy({ where: { userId, boatId } });
    if (deleteCount < 1) {
      return res.status(401).json({
        errorMessage: "나가기가 정상적으로 처리되지 않았습니다.",
      });
    }

    // 작성했던 comment deletedAt으로 처리하기
    await Comments.update(
      { deletedAt: new Date() },
      { where: { boatId, userId } }
    );

    // 알람생성
    await Alarms.create({
      userId: boat.userId,
      isRead: false,
      message: `${user.nickName}님이 모임에 나갔습니다.`,
    });
    return res.status(200).json({ message: "나가기 성공." });
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ errorMessage: "나가기 실패. 요청이 올바르지 않습니다." });
  }
});
module.exports = router;
