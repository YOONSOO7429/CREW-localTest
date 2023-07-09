const jwt = require("jsonwebtoken");
const { Users } = require("../models");

module.exports = async (req, res, next) => {
  try {
    const authorizationCookies = req.cookies.authorization;
    const authorizationHeaders = req.headers.authorization;
    const authorization = authorizationCookies
      ? authorizationCookies
      : authorizationHeaders;

    // # 403 Cookie가 존재하지 않을 경우
    if (!authorization) {
      return res
        .status(403)
        .json({ errorMessage: "로그인이 필요한 기능입니다." });
    }

    const [tokenType, tokenValue] = authorization.split(" "); // 중괄호{} 를 대괄호[]로 수정
    if (tokenType !== "Bearer") {
      res.clearCookie("authorization");
      return res
        .status(403)
        .json({ errorMessage: "전달된 쿠키에서 오류가 발생하였습니다." });
    }

    const { userId } = jwt.verify(tokenValue, process.env.JWT_SECRET);
    const user = await Users.findByPk(userId);

    if (user) {
      res.locals.user = user;
      next();
    } else {
      return res
        .status(403)
        .json({ errorMessage: "회원정보가 없습니다. 회원가입이 필요합니다." });
    }
  } catch (error) {
    console.log("error : ", error);
    res.clearCookie("authorization");
    return res.status(403).json({
      errorMessage: "로그인 요청이 올바르지 않습니다.",
    });
  }
};
