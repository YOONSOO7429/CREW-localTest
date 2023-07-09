const jwt = require("jsonwebtoken");
const { Users } = require("../models");

module.exports = async (socket, next) => {
  try {
    const authorizationCookies = socket.handshake.headers.authorization;
    const authorizationHeaders = socket.handshake.headers.authorization;
    const authorization = authorizationCookies
      ? authorizationCookies
      : authorizationHeaders;

    socket.locals = {}; // 새로운 객체 생성
    socket.locals.user = {}; // user 객체 정의

    if (!authorization) {
      return next();
    }

    const [tokenType, tokenValue] = authorization.split(" ");
    if (tokenType !== "Bearer") {
      socket.clearCookie("authorization");
      return res
        .status(403)
        .json({ errorMessage: "전달된 쿠키에서 오류가 발생하였습니다." });
    }

    try {
      const { userId } = jwt.verify(tokenValue, process.env.JWT_SECRET);
      const user = await Users.findByPk(userId);
      socket.locals.user = user;
    } catch (error) {
      // 토큰 검증이 실패하는 경우, 사용자를 게스트로 처리합니다.
      console.log("토큰 검증 실패:", error);
    }

    next(); // next() 호출 시 반환 값을 반환합니다.
  } catch (e) {
    console.error(e);
    throw new Error("loginMiddleware. 요청이 올바르지 않습니다.");
  }
};
