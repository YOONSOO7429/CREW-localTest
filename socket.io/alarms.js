const { Alarms } = require("../models");
const socketLoginCheck = require("../middlewares/socketLoginCheck");

module.exports = (io) => {
  // socket.io 연결
  io.on("connection", (socket) => {
    socket.onAny((event) => {
      console.log(`Socket 연결: ${event}`);
    });

    socket.on("alarms", async () => {
      try {
        // 토큰 검사
        await socketLoginCheck(socket, (err) => {
          if (err) {
            socket.emit("error", err.message);
          }
        });
        const userId = socket.locals.user ? socket.locals.user.userId : null;

        if (userId === null) {
          socket.emit("error", "게스트입니다.");
        }
        if (userId) {
          const alarms = await Alarms.findAll({
            attributes: ["alarmId", "isRead", "message"],
            where: { userId, isRead: false },
            raw: true,
          });

          // alarms 없을 경우
          if (!alarms) {
            socket.emit("error", "조회된 알림이 없습니다.");
          }
          socket.emit("alarmList", { data: alarms });
        }

        // 알림이 추가될 때마다 실시간으로 프론트엔드로 전달
        Alarms.addHook("afterCreate", async (alarm) => {
          if (alarm.userId === userId && !alarm.isRead) {
            socket.emit("newAlarm", { data: alarm });
          }
        });

        socket.on("alarmRead", async (alarmId) => {
          const alarm = await Alarms.findOne({ where: { alarmId, userId } });
          if (!alarm || userId !== alarm.userId) {
            socket.emit("error", "알림 읽음 처리. 권한이 없습니다.");
          }
          // alarmId에 해당하는 부분 isRead 처리
          const updateCount = await Alarms.update(
            { isRead: true },
            { where: { alarmId, userId } }
          );
          if (!updateCount) {
            socket.emit("error", "알림 읽기 처리 실패.");
          }
          if (updateCount) {
            const alarms = await Alarms.findAll({
              attributes: ["alarmId", "isRead", "message"],
              where: { userId, isRead: false },
              raw: true,
            });
            socket.emit("alarmList", { data: alarms });
          }
        });
      } catch (e) {
        console.log(e);
      }
    });
    socket.on("disconnect", async () => {
      console.log("사용자가 연결을 종료했습니다.");
    });
  });
};
