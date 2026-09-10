const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const fs = require("fs");
const path = require("path");

// قاعدة البيانات
let db = new sqlite3.Database('campus.db');

// ===============================
// إنشاء السيرفر
// ===============================
const server = http.createServer((req, res) => {

  res.setHeader("Access-Control-Allow-Origin", "*");

  // ===============================
  // 🔍 API البحث
  // ===============================
  if (req.url.includes('/search')) {

    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    let query = urlObj.searchParams.get("q");

    db.all(
      `
      SELECT
        locations.*,

        room_locations.x AS location_x,
        room_locations.y AS location_y,
        room_locations.path AS location_path

      FROM locations

      LEFT JOIN room_locations
        ON locations.location_id = room_locations.id

      WHERE
        LOWER(locations.name) LIKE LOWER(?)
        OR LOWER(locations.room_number) LIKE LOWER(?)
        OR LOWER(locations.keywords) LIKE LOWER(?)
      `,

      [`%${query}%`, `%${query}%`, `%${query}%`],

      (err, rows) => {

        res.setHeader(
          'Content-Type',
          'application/json; charset=utf-8'
        );

        if (err) {
          console.log("DATABASE ERROR:", err);

          res.end(JSON.stringify({
            error: "database error"
          }));

          return;
        }

        if (rows && rows.length > 0) {

          console.log("SEARCH RESULT:", rows[0]);

          res.end(JSON.stringify(rows[0]));

        } else {

          res.end(JSON.stringify({
            error: "الموقع غير موجود"
          }));

        }
      }
    );

  } else {

    // ===============================
    // 🔥 عرض الملفات
    // ===============================
    let filePath = path.join(
      __dirname,
      req.url === "/" ? "index.html" : req.url
    );

    let ext = path.extname(filePath);

    let contentType = "text/html";

    if (ext === ".css") contentType = "text/css";
    if (ext === ".js") contentType = "text/javascript";
    if (ext === ".png") contentType = "image/png";
    if (ext === ".jpg") contentType = "image/jpeg";
    if (ext === ".svg") contentType = "image/svg+xml";

    fs.readFile(filePath, (err, data) => {

      if (err) {
        res.writeHead(404);
        res.end("File not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": contentType
      });

      res.end(data);

    });

  }

});

// ===============================
// 🚀 تشغيل السيرفر
// ===============================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});