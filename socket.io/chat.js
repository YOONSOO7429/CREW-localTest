const { Users, Chats } = require("../models");
const socketLoginCheck = require("../middlewares/socketLoginCheck");

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.onAny((event) => {
      console.log(`socekt Event: ${event}`);
    });

    // "enterRoom 이벤트를 통해 채팅방에 입장"
    socket.on("enterRoom", (boatId, done) => {
      // 해당 채팅방에 소켓을 입장시킨다.
      socket.join(boatId);
      done(); // 클라이언트에게 완료를 알린다.
    });

    // 소켓이 연결 해제될 때 실행되는 "disconnecting" 이벤트
    socket.on("disconnecting");

    // newMessage로 새로운 메시지를 전송하고 데이터베이스에 저장
    socket.on("newMessage", async (msg, boatId, done) => {
      try {
        const nickName = socket.nickName;

        // 채팅방에 새로운 메시지를 전송
        socket.to(boatId).emit("newChat", `${nickName}: ${msg}`);
        done(); // 클라이언트에게 완료를 알림

        // 채팅 내용을 데이터베이스에 저장
        const chat = await Chats.findOne({ where: { boatId } });

        if (chat) {
          // 채팅 내용이 존재하면 데이터를 업데이트한다.
          let chatData = JSON.parse(chat.chatMessage) || [];
          chatData.push({ [nickName]: msg });
          chat.chatMessage = JSON.stringify(chatData);
          await chat.save();
        } else {
          // 새로운 채팅 내용을 생성
          await Chats.create({
            boatId,
            chatMessage: JSON.stringify([{ [nickName]: msg }]),
          });
        }
      } catch (e) {
        console.error(`채팅 저장 실패:`, error);
      }
    });
  });
};
