const jwt = require("jsonwebtoken");
const { Users } = require("../models");

module.exports = async (req, res, next) => {
  try {
    const authorizationCookies = req.cookies.authorization;
    const authorizationHeaders = req.headers.authorization;
    const authorization = authorizationCookies
      ? authorizationCookies
      : authorizationHeaders;

    // 인증 토큰이 없는 경우 다음 미들웨어로 진행합니다.
    if (!authorization) {
      return next(); // next() 호출 시 반환 값을 반환합니다.
    }

    const [tokenType, tokenValue] = authorization.split(" ");
    if (tokenType !== "Bearer") {
      res.clearCookie("authorization");
      return res
        .status(403)
        .json({ errorMessage: "전달된 쿠키에서 오류가 발생하였습니다." });
    }

    try {
      const { userId } = jwt.verify(tokenValue, process.env.JWT_SECRET);
      const user = await Users.findByPk(userId);
      res.locals.user = user;
    } catch (error) {
      // 토큰 검증이 실패하는 경우, 사용자를 게스트로 처리합니다.
      console.log("토큰 검증 실패:", error);
    }

    next(); // next() 호출 시 반환 값을 반환합니다.
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ errorMessage: "loginMiddleware. 요청이 올바르지 않습니다." });
  }
};
