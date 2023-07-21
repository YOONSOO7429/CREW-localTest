// /* 2. MAP API를 활용해 글 목록 조회 API
//      @ boatId, title, keyword, endDate, maxCrewNum, crewCount, address 조회
//      @ 위치를 통해 MAP 위에 보트 모양과 keyword만 보이게 한다. 350 X656
//      @ 클릭할 경우 모집 글이 보이게 한다.
//      @ 클러스터링 적용 */
//      router.get("/boat/map", async (req, res) => {
//       try {
//         // 범위 설정에 필요한 latitude와 longitude 받기
//         let data = req.query;
//         let swLatitude = data.Bounds.swLatLng[0];
//         let swLongitude = data.Bounds.swLatLng[1];
//         let neLatitude = data.Bounds.neLatLng[0];
//         let neLongitude = data.Bounds.neLatLng[1];
//         let level = data.Bounds.level;

//         // 클러스터링을 위한 위도와 경도 조회
//         const clusterHandler = async () => {
//           const boats = await Boats.findAll({
//             attributes: ["latitude", "longitude"],
//             where: {
//               isDone: false,
//               deletedAt: null,
//               latitude: { [Op.between]: [swLatitude, neLatitude] },
//               longitude: { [Op.between]: [swLongitude, neLongitude] },
//             },
//             raw: true,
//           });
//           return boats;
//         };

//         // {위도, 경도, count} 객체로 묶어주기
//         const boatCount = (arr, a) => {
//           const counts = {};
//           const result = [];

//           // 객체 카운트 계산
//           arr.forEach((obj) => {
//             const fixedLatitude = obj.latitude.toFixed(a);
//             const fixedLongitude = obj.longitude.toFixed(a);
//             const key = `${fixedLatitude}, ${fixedLongitude}`;
//             counts[key] = (counts[key] || 0) + 1;
//           });

//           Object.entries(counts).forEach(([key, count]) => {
//             const [latitude, longitude] = key.split(",");
//             const obj = {
//               latitude: parseFloat(latitude),
//               longitude: parseFloat(longitude),
//               count,
//             };
//             result.push(obj);
//           });

//           return result;
//         };

//         // level => 1, 2
//         if (0 < level < 3) {
//           const data = await clusterHandler();
//           const boats = boatCount(data, 1);
//           return res.status(200).json({ boats });
//         }

//         // level => 3, 4
//         if (2 < level < 5) {
//           const data = await clusterHandler();
//           const boats = boatCount(data, 2);
//           return res.status(200).json({ boats });
//         }

//         // level => 5, 6
//         if (4 < level < 7) {
//           const data = await clusterHandler();
//           const boats = boatCount(data, 3);
//           return res.status(200).json({ boats });
//         }

//         // level => 7, 8
//         if (6 < level < 9) {
//           const data = await clusterHandler();
//           const boats = boatCount(data, 4);
//           return res.status(200).json({ boats });
//         }

//         // level => 9, 10
//         if (8 < level < 11) {
//           const data = await clusterHandler();
//           const boats = boatCount(data, 5);
//           return res.status(200).json({ boats });
//         }

//         // (클러스터링 적용 X) level => 11, 12, 13, 14
//         if (10 < level < 15) {
//           // Crew 모집 글 목록 조회
//           const boats = await Boats.findAll({
//             attributes: [
//               "boatId",
//               "title",
//               "keyword",
//               "endDate",
//               "maxCrewNum",
//               [
//                 sequelize.literal(
//                   `(SELECT COUNT(*) FROM Crews WHERE Boats.boatId = Crews.boatId AND Crews.isReleased = false) + 1`
//                 ),
//                 "crewNum",
//               ],
//               "address",
//               "latitude",
//               "longitude",
//             ],
//             where: {
//               isDone: false,
//               deletedAt: null,
//               latitude: { [Op.between]: [swLatitude, neLatitude] },
//               longitude: { [Op.between]: [swLongitude, neLongitude] },
//             },
//             group: ["Boats.boatId"],
//             raw: true,
//           });

//           // 작성된 모집 글이 없을 경우
//           if (!boats) {
//             return res.status(202).json({ boats: [] });
//           }

//           return res.status(200).json({ boats });
//         }
//       } catch (e) {
//         console.log(e);
//         return res
//           .status(400)
//           .json({ errorMessage: "전체 목록 조회 실패. 요청이 올바르지 않습니다." });
//       }
//     });
