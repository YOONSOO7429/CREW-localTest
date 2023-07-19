const express = require("express");
const router = express.Router();
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const authJwt = require("../middlewares/authMiddleware");
const { Users, Boats, Crews } = require("../models");

// s3 설정
require("dotenv").config();

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();

// multer 설정
const upload = multer({
  storage: multerS3({
    s3: s3,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    bucket: process.env.AWS_BUCKET,
    key: (req, file, callback) => {
      const fileName = Date.now().toString() + file.originalname;
      callback(null, fileName);
    },
    // 용량 제한
    limits: { fileSize: 5 * 1024 * 1024 },
  }),
});

// 기존 이미지를 S3에서 삭제하는 함수
const deleteOldImage = async (url) => {
  if (!url) return; // URL이 제공되지 않으면 아무것도 삭제하지 않고 리턴
  const key = url.split("/").pop();
  const params = { Bucket: process.env.AWS_BUCKET, Key: key };
  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error(
      "기존 이미지를 S3에서 삭제하는데 오류가 발생했습니다:",
      error
    );
  }
};

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

/* mypage 수정 이미지와 닉네임 수정*/
router.put(
  "/mypage/edit",
  upload.single("image"),
  authJwt,
  async (req, res) => {
    try {
      // user 정보
      const { userId } = res.locals.user;
      const user = await Users.findOne({ where: userId });

      // 사용자 객체에서 기존 프로필 이미지 URL 가져오기
      const existingProfileImage = user.profileImage;

      // body로 정보 입력
      const { nickName } = req.body;
      const image = req.file;

      // 수정 검사
      if (nickName < 1) {
        return res
          .status(412)
          .json({ errorMessage: "유효하지 않은 nickName입니다." });
      }
      if (image === "") {
        return res
          .status(412)
          .json({ errorMessage: "유효하지 않은 image입니다." });
      }

      // 수정할 내용에 따라 수정
      if (user.nickName !== nickName) {
        user.nickName = nickName;
      }
      if (user.profileImage !== image.location) {
        // 기존 이미지를 S3에서 삭제 (기존 이미지가 있을 경우)
        deleteOldImage(existingProfileImage);
        user.profileImage = image.location;
      }

      // 수정할 부분이 없을 경우 / 수정할 내용이 있다면 해당 부분만 수정
      if (!image) {
        return res
          .status(412)
          .json({ errorMessage: "수정할 내용이 없습니다." });
      }

      // update
      const updateCount = await user.save();

      // 수정 검사
      if (updateCount < 1) {
        return res.status(404).json({
          errorMessage: "mypage 수정이 정상적으로 수정되지 않았습니다.",
        });
      }

      // 수정 완료
      return res.status(200).json({ message: "mypage 수정 완료." });
    } catch (e) {
      console.log(e);
      return res
        .status(400)
        .json({ errorMessage: "mypage 수정 실패. 요청이 올바르지 않습니다." });
    }
  }
);

module.exports = router;
