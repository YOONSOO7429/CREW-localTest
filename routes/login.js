const express = require("express");
const router = express.Router();
const { Users } = require("../models");
const jwt = require("jsonwebtoken");
const authJwt = require("../middlewares/authMiddleware");

//로그인
router.get("/login", async (req, res) => {
  try {
    // const userId = 3;

    // const token = jwt.sign(
    //   {
    //     userId,
    //   },
    //   process.env.JWT_SECRET
    // );

    // const query = "?token=" + token;
    // res.locals.token = token;

    // res.cookie("authorization", `Bearer ${token}`);

    // res.redirect(`http://localhost:3000/${query}`);
    const { email } = req.body;

    const user = await Users.findOne({
      where: { email },
    });
    const token = jwt.sign(
      {
        userId: user.userId,
      },
      process.env.JWT_SECRET
    );
    res.cookie("authorization", `Bearer ${token}`);

    return res.status(201).json({ token: token, message: "로그인 성공" });
  } catch (error) {
    console.log("error : ", error);
    return res.json({ errorMessage: "요청이 올바르지 않습니다." } + error);
  }
});

// userId 넣어주는 API
router.get("/currentUser", authJwt, async (req, res) => {
  try {
    const { userId } = res.locals.user;
    return res.status(200).json({ userId });
  } catch (e) {
    console.log("currentUser error : ", e);
    return res.status(400).json({ errorMessage: "userId 전달 실패" });
  }
});

module.exports = router;
