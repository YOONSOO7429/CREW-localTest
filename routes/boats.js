const express = require("express");
const authJwt = require("../middlewares/authMiddleware"); // Crew 회원 확인을 위한 middleware
const loginMiddleware = require("../middlewares/loginMiddleware"); // 로그인한 회원 확인을 위한 middleware
const { Op } = require("sequelize");
const {
  sequelize,
  Users,
  Boats,
  Comments,
  Crews,
  Alarms,
} = require("../models");
const router = express.Router();

/* 1. Crew 모집 글 작성 API
     @ 토큰을 검사하여, 유효한 토큰일 경우에만 채용공고 글 작성 가능
     @ title, content, keyword, maxCrewNum, endDate, address */
router.post("/boat/write", authJwt, async (req, res) => {
  try {
    // userId
    const { userId, email } = res.locals.user;
    // req.body로 작성 내용 받아오기
    const {
      title,
      content,
      keyword,
      maxCrewNum,
      endDate,
      address,
      latitude,
      longitude,
    } = req.body;
    // 첫 공개 여부는 공개로 올린다.
    const isDone = false;
    // user의 nickName 가져오기
    const captain = await Users.findOne({
      attributes: ["nickName"],
      where: { userId },
    });

    // 작성 내용 확인
    if (title < 1) {
      return res
        .status(412)
        .json({ errorMessage: "title에 작성된 내용이 없습니다." });
    }
    if (content < 1) {
      return res
        .status(412)
        .json({ errorMessage: "content에 작성된 내용이 없습니다." });
    }
    if (keyword < 1) {
      return res
        .status(412)
        .json({ errorMessage: "keyword에 작성된 내용이 없습니다." });
    }
    if (maxCrewNum < 1) {
      return res
        .status(412)
        .json({ errorMessage: "모집 인원에 작성된 내용이 없습니다." });
    }
    if (endDate === undefined) {
      return res
        .status(412)
        .json({ errorMessage: "마감 일자 형식이 맞지 않습니다." });
    }
    if (address < 1) {
      return res
        .status(412)
        .json({ errorMessage: "address가 작성된 내용이 없습니다." });
    }
    if (latitude === null) {
      return res
        .status(412)
        .json({ errorMessage: "latitude가 작성된 내용이 없습니다." });
    }
    if (longitude === null) {
      return res
        .status(412)
        .json({ errorMessage: "longitude가 작성된 내용이 없습니다." });
    }

    // Crew 모집 글 작성
    await Boats.create({
      userId,
      email,
      captain: captain.nickName,
      title,
      content,
      keyword,
      endDate,
      address,
      maxCrewNum,
      isDone,
      latitude,
      longitude,
    });
    return res.status(200).json({ message: "Crew 모집 글 작성에 성공" });
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      errorMessage: "Crew 모집 글 작성 실패. 요청이 올바르지 않습니다.",
    });
  }
});

/* 2. MAP API를 활용해 글 목록 조회 API
     @ boatId, title, keyword, endDate, maxCrewNum, crewCount, address 조회
     @ 위치를 통해 MAP 위에 보트 모양과 keyword만 보이게 한다. 350 X656
     @ 클릭할 경우 모집 글이 보이게 한다.
     @ 클러스터링 적용 */
router.get("/boat/map", async (req, res) => {
  try {
    // 범위 설정에 필요한 latitude와 longitude 받기
    let data = req.query;
    let swLatitude = data.Bounds.swLatLng[0];
    let swLongitude = data.Bounds.swLatLng[1];
    let neLatitude = data.Bounds.neLatLng[0];
    let neLongitude = data.Bounds.neLatLng[1];
    let level = data.Bounds.level;

    // 클러스터링을 위한 위도와 경도 조회
    const clusterHandler = async () => {
      const boats = await Boats.findAll({
        attributes: ["latitude", "longitude"],
        where: {
          isDone: false,
          deletedAt: null,
          latitude: { [Op.between]: [swLatitude, neLatitude] },
          longitude: { [Op.between]: [swLongitude, neLongitude] },
        },
        raw: true,
      });
      return boats;
    };

    // {위도, 경도, count} 객체로 묶어주기
    const boatCount = (arr, a) => {
      const counts = {};
      const result = [];

      // 객체 카운트 계산
      arr.forEach((obj) => {
        const fixedLatitude = obj.latitude.toFixed(a);
        const fixedLongitude = obj.longitude.toFixed(a);
        const key = `${fixedLatitude}, ${fixedLongitude}`;
        counts[key] = (counts[key] || 0) + 1;
      });

      Object.entries(counts).forEach(([key, count]) => {
        const [latitude, longitude] = key.split(",");
        const obj = {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          count,
        };
        result.push(obj);
      });

      return result;
    };

    // level => 1, 2
    if (0 < level < 3) {
      const data = await clusterHandler();
      const boats = boatCount(data, 1);
      return res.status(200).json({ boats });
    }

    // level => 3, 4
    if (2 < level < 5) {
      const data = await clusterHandler();
      const boats = boatCount(data, 2);
      return res.status(200).json({ boats });
    }

    // level => 5, 6
    if (4 < level < 7) {
      const data = await clusterHandler();
      const boats = boatCount(data, 3);
      return res.status(200).json({ boats });
    }

    // level => 7, 8
    if (6 < level < 9) {
      const data = await clusterHandler();
      const boats = boatCount(data, 4);
      return res.status(200).json({ boats });
    }

    // level => 9, 10
    if (8 < level < 11) {
      const data = await clusterHandler();
      const boats = boatCount(data, 5);
      return res.status(200).json({ boats });
    }

    // (클러스터링 적용 X) level => 11, 12, 13, 14
    if (10 < level < 15) {
      // Crew 모집 글 목록 조회
      const boats = await Boats.findAll({
        attributes: [
          "boatId",
          "title",
          "keyword",
          "endDate",
          "maxCrewNum",
          [
            sequelize.literal(
              `(SELECT COUNT(*) FROM Crews WHERE Boats.boatId = Crews.boatId AND Crews.isReleased = false) + 1`
            ),
            "crewNum",
          ],
          "address",
          "latitude",
          "longitude",
        ],
        where: {
          isDone: false,
          deletedAt: null,
          latitude: { [Op.between]: [swLatitude, neLatitude] },
          longitude: { [Op.between]: [swLongitude, neLongitude] },
        },
        group: ["Boats.boatId"],
        raw: true,
      });

      // 작성된 모집 글이 없을 경우
      if (!boats) {
        return res.status(202).json({ boats: [] });
      }

      return res.status(200).json({ boats });
    }
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ errorMessage: "전체 목록 조회 실패. 요청이 올바르지 않습니다." });
  }
});

/* 3. Crew 모집 글 상세 조회 API
     @ <Crew, 선장용> boatId, title, content, keyword, maxCrewNum, crewCount, endDate, address 조회 */
router.get("/boat/:boatId", loginMiddleware, async (req, res) => {
  try {
    const { boatId } = req.params;
    // userId 확인
    const userId = res.locals.user ? res.locals.user.userId : null;
    // crewMember 조회
    const crew = await Crews.findAll({
      attributes: ["userId", "nickName"],
      where: { boatId, isReleased: false },
      raw: true,
    });

    // 글 조회
    const boat = await Boats.findOne({
      attributes: [
        "boatId",
        ["userId", "captainId"],
        "captain",
        "title",
        "keyword",
        "content",
        "maxCrewNum",
        [
          sequelize.literal(
            `(SELECT COUNT(*) FROM Crews WHERE Boats.boatId = Crews.boatId AND Crews.isReleased = false) + 1`
          ),
          "crewNum",
        ],
        "endDate",
        "address",
        "createdAt",
        "latitude",
        "longitude",
      ],
      where: { boatId, deletedAt: null },
      include: [
        {
          model: Crews,
          attributes: [],
        },
      ],
      group: ["Boats.boatId"],
      raw: true,
    });

    // 글이 없을 경우
    if (!boat) {
      return res.status(404).json({ errorMessage: "글이 존재하지 않습니다." });
    }

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

    // captain를 check해서 조회
    // 가입 유저(모임에 참여 X)
    if (!userId) {
      const response = { boat, personType: "person" };
      return res.status(200).json(response);
    }
    // captain일 경우
    if (userId === boat.captainId) {
      const response = { boat, crew, comments, personType: "captain" };
      return res.status(200).json(response);
    }

    for (let i = 0; i < crew.length; i++) {
      // crew일 경우
      if (userId === crew[i].userId) {
        return res
          .status(200)
          .json({ boat, crew, comments, personType: "crew" });
      }
    }
    // guest일 경우
    const response = { boat, personType: "person" };
    return res.status(200).json(response);
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      errorMessage: "모집 글 상세 조회에 실패. 요청이 올바르지 않습니다.",
    });
  }
});

/* 4. crew 모집 글 수정 API
   @ 토큰을 검사형, 해당 사용자가 작성한 채용공고 글만 수정 가능
   @ title, content, keyword, endDate, maxCrewNum, address 맞춰서 수정 */
router.put("/boat/:boatId", authJwt, async (req, res) => {
  try {
    // params로 boatId
    const { boatId } = req.params;
    // user
    const { userId } = res.locals.user;
    // boat 조회
    const boat = await Boats.findOne({ where: { boatId } });
    // body로 입력받기
    const {
      title,
      content,
      keyword,
      endDate,
      maxCrewNum,
      address,
      latitude,
      longitude,
    } = req.body;

    // 모집 글이 없을 경우
    if (!boat) {
      return res.status(400).json({ errorMessage: "존재하지 않는 배입니다." });
    }
    // 권한이 없을 경우
    if (userId !== boat.userId) {
      return res.status(403).json({ errorMessage: "글 수정 권한이 없습니다." });
    }

    // 수정 검사
    if (title < 1) {
      return res
        .status(412)
        .json({ errorMessage: "유효하지 않은 title입니다." });
    }
    if (content < 1) {
      return res
        .status(412)
        .json({ errorMessage: "유효하지 않은 content입니다." });
    }
    if (keyword < 1) {
      return res
        .status(412)
        .json({ errorMessage: "유효하지 않은 keyword입니다." });
    }
    if (endDate === undefined) {
      return res
        .status(412)
        .json({ errorMessage: "유효하지 않은 endDate입니다." });
    }
    if (address < 1) {
      return res
        .status(412)
        .json({ errorMessage: "유효하지 않은 address입니다." });
    }
    if (maxCrewNum < 1) {
      return res
        .status(412)
        .json({ errorMessage: "유효하지 않은 maxCrewNum입니다." });
    }
    if (latitude < 1) {
      return res
        .status(412)
        .json({ errorMessage: "유효하지 않은 latitude입니다." });
    }
    if (longitude < 1) {
      return res
        .status(412)
        .json({ errorMessage: "유효하지 않은 longitude입니다." });
    }

    // 수정할 내용에 따라 수정
    if (boat.title !== title) {
      boat.title = title;
    }
    if (boat.content !== content) {
      boat.content = content;
    }
    if (boat.keyword !== keyword) {
      boat.keyword = keyword;
    }
    if (boat.endDate !== endDate) {
      boat.endDate = endDate;
    }
    if (boat.address !== address) {
      boat.address = address;
    }
    if (boat.maxCrewNum !== maxCrewNum) {
      boat.maxCrewNum = maxCrewNum;
    }
    if (boat.latitude !== latitude) {
      boat.latitude = latitude;
    }
    if (boat.longitude !== longitude) {
      boat.longitude = longitude;
    }

    // 수정할 부분이 모두 없을 경우 / 수정할 내용이 있다면 해당 부분만 수정
    if (
      !(
        title ||
        content ||
        keyword ||
        endDate ||
        maxCrewNum ||
        address ||
        latitude ||
        longitude
      )
    ) {
      return res.status(412).json({ errorMessage: "수정할 내용이 없습니다." });
    }

    // isDone 부분
    const isDone = false;
    boat.isDone = isDone;
    const updateCount = await boat.save();

    // 수정한 글이 없을 경우
    if (updateCount < 1) {
      return res.status(404).json({
        errorMessage: "모집 글이 정상적으로 수정되지 않았습니다.",
      });
    }

    // 수정 완료
    return res.status(200).json({ message: "모집 글을 수정 완료." });
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ errorMessage: "모집 글 수정 실패. 요청이 올바르지 않습니다." });
  }
});

/* 5. crew 모집 글 공개 여부 API
   @ 토큰을 검사, 해당 사용자가 작성한 채용공고 글만 공개 / 비공개 가능 */
router.patch("/boat/:boatId", authJwt, async (req, res) => {
  try {
    // user
    const { userId } = res.locals.user;
    // params로 boatId
    const { boatId } = req.params;
    // body로 isDone 입력받기
    const { isDone } = req.body;

    // 모집 글 조회
    const boat = await Boats.findOne({ where: { boatId } });
    // 모집 글이 없을 경우
    if (!boat) {
      return res
        .status(403)
        .json({ errorMessage: "존재하지 않는 모집 글입니다." });
    }
    // 권한이 없을 경우
    if (userId !== boat.userId) {
      return res
        .status(401)
        .json({ errorMessage: "모집 글 상태 전환 권한이 없습니다." });
    }

    // 유효성 검사
    if (isDone === 3) {
      return res
        .status(412)
        .json({ errorMessage: "올바르지 않은 상태 전환 요청입니다." });
    } else {
      boat.isDone = isDone;
    }
    const updateIsDoneCount = await boat.save();

    // 수정한 모집 글이 없을 경우
    if (!updateIsDoneCount) {
      return res
        .status(404)
        .json({ errorMessage: "모집 글을 전환하지 못했습니다." });
    }

    // 전환 완료
    if (isDone === false) {
      return res.status(200).json({ message: "crew 모집 글 공개 완료" });
    }
    if (isDone === true) {
      return res.status(200).json({ message: "crew 모집 글 비공개 완료" });
    }
  } catch (e) {
    console.log(e);
    return res
      .status(400)
      .json({ errorMessage: "상태 업데이트 실패. 요청이 올바르지 않습니다." });
  }
});

/* 6. crew 모집 글 deletedAt
   @ 모집 글에 deletedAt 컬럼을 이용해 db에 남겨두지만 실제 서비스에서는 조회 X 
   @ Crews 테이블에서 boatId에 해당하는 부분 삭제
   @ Comments 테이블에서 boatId에 해당하는 부분 deletedAt으로
   @ 삭제한 부분 알림으로 알리기 */
router.patch("/boat/:boatId/delete", authJwt, async (req, res) => {
  try {
    // user
    const { userId } = res.locals.user;

    // params로 boatId
    const { boatId } = req.params;
    // body로 deletedAt
    const { deletedAt } = req.body;

    // 모집 글 조회
    const boat = await Boats.findByPk(boatId);

    // 모집 글이 없을 경우
    if (!boat) {
      return res.status(404).json({ errorMessage: "존재하지 않는 글입니다." });
    }

    // 모집 글 삭제 권한 확인
    if (userId !== boat.userId) {
      return res
        .status(401)
        .json({ errorMessage: "모집 글 삭제 권한이 없습니다." });
    }

    // 모집 글 삭제
    if (deletedAt === undefined) {
      return res
        .status(412)
        .json({ errorMessage: "삭제 요청이 올바르지 않습니다." });
    } else {
      boat.deletedAt = deletedAt;
    }
    // crewMember 조회
    const crewMember = await Crews.findAll({
      attributes: ["userId"],
      where: { boatId },
      raw: true,
    });

    const deletedAtCount = await boat.save();
    // softDelete 안됐을 경우
    if (!deletedAtCount) {
      return res.status(404).json({ errorMessage: "삭제된 글이 없습니다." });
    }
    if (deletedAtCount) {
      // Crews 테이블에서 boatId에 해당하는 부분 삭제
      await Crews.destroy({ where: { boatId } });
      // Comments도 softdelete 상태 만들기
      await Comments.update({ deletedAt: new Date() }, { where: { boatId } });

      // 삭제했다는 알림 만들기
      for (let i = 0; i < crewMember.length; i++) {
        await Alarms.create({
          userId: crewMember[i].userId,
          isRead: false,
          message: `${boat.title} 글이 삭제됐습니다.`,
        });
      }
      // 삭제 완료
      return res.status(200).json({ message: "모집 글을 삭제 완료." });
    }
  } catch (e) {
    console.log(e);
    return res.status(400).json({
      errorMessage: "모집 글 삭제 실패. 요청이 올바르지 않습니다.",
    });
  }
});

module.exports = router;
