const http = require('http');
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('campus.db');

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS locations (name TEXT, description TEXT)");

  db.run("INSERT OR IGNORE INTO locations VALUES ('A101', 'الدور الأول - بعد المصعد يمين')");
  db.run("INSERT OR IGNORE INTO locations VALUES ('Dr Ahmed', 'الدور الثاني - بجانب السكرتارية')");
});

const server = http.createServer((req, res) => {

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  if (req.url.includes('/search')) {

    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    let query = urlObj.searchParams.get("q");

    db.get("SELECT description FROM locations WHERE name = ?", [query], (err, row) => {

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');

      if (row) {
        res.end(row.description);
      } else {
        res.end("الموقع غير موجود");
      }
    });

  } else {
    res.end("Server is running 🚀");
  }

});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});