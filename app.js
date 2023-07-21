// import
const express = require("express");
const app = express();
const kakao = require("./passport/kakaoStrategy");
const passport = require("passport");
const path = require("path");
const helmet = require("helmet");
const http = require("http");
const server = http.createServer(app);
require("dotenv").config();

// node-cron
const cron = require("node-cron");
const { Op } = require("sequelize");
const { Boats } = require("./models");

// 보트 업데이트 함수
const updateBoats = async () => {
  const today = new Date();
  const boats = await Boats.findAll({
    where: {
      [Op.and]: [{ endDate: { [Op.not]: "" } }],
      isDone: false,
    },
    raw: true,
  });

  for (const boat of boats) {
    if (new Date(boat.endDate) <= today) {
      await Boats.update({ isDone: true }, { where: { boatId: boat.boatId } });
      console.log(`보트 ${boat.boatId} 수정 완료`);
    }
  }
};

// 보트 업데이트 일정 설정 함수
const scheduleBoatsUpdate = async () => {
  try {
    await updateBoats();
    console.log("업데이트 완료.");
  } catch (e) {
    console.error("마감기한 업데이트 에러", e);
  }
};

// 크론 작업 생성 및 시작
const scheduledTask = cron.schedule("0 0 * * *", scheduleBoatsUpdate, {
  scheduled: true,
  timezone: "Asia/Seoul",
});

scheduledTask.start();

// router
const authRouter = require("./routes/auth");
const boatRouter = require("./routes/boats");
const commentRouter = require("./routes/comments");
const alarmRouter = require("./routes/alarms");
const mypageRouter = require("./routes/mypage");
const loginRouter = require("./routes/login");
const reportRouter = require("./routes/reports");

// 설정
const cookieParser = require("cookie-parser");
const session = require("express-session");
const cors = require("cors");

app.use(
  cors({
    origin: [
      "*.ysizuku.com",
      "http://localhost:3000",
      "http://react.ysizuku.com",
      "https://react.ysizuku.com",
    ],
    credentials: true,
    withCredentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(helmet());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      domain: ".ysizuku.com", // .ysizuku.com으로 설정하면 모든 서브도메인에서 쿠키를 사용할 수 있습니다.
      path: "/", // /로 설정하면 모든 페이지에서 쿠키를 사용할 수 있습니다.
      secure: false, // https가 아닌 환경에서도 사용할 수 있습니다.
      httpOnly: false, // 자바스크립트에서 쿠키를 확인할 수 있습니다.
    },
  })
);

const io = require("socket.io")(server, {
  cors: {
    origin: [
      "*.ysizuku.com",
      "http://localhost:3000",
      "http://react.ysizuku.com",
      "https://react.ysizuku.com",
    ],
    credentials: true,
  },
});

const socketHandlers = require("./socket.io");

// passport-kakao
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((token, done) => {
  done(null, token);
});

passport.deserializeUser((token, done) => {
  // 토큰을 이용하여 사용자를 인증 또는 사용자 정보를 가져오는 로직 구현
  // 예시: 토큰에서 userId를 추출하여 사용자 정보를 가져옴
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;

  Users.findByPk(userId)
    .then((user) => {
      done(null, user); // 사용자 객체를 세션에서 가져옴
    })
    .catch((err) => {
      done(err);
    });
});

kakao(); // kakaoStrategy.js의 module.exports를 실행합니다.

app.use("/", [
  boatRouter,
  authRouter,
  alarmRouter,
  mypageRouter,
  loginRouter,
  commentRouter,
  reportRouter,
]);

socketHandlers(io);

app.get("/", async (req, res) => {
  return res.sendFile(__dirname + "/index.html");
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(PORT, "포트 번호로 서버가 실행되었습니다.");
});
