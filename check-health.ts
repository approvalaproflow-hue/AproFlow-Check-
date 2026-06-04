import http from "http";

const req = http.get("http://localhost:3000/api/health-database", (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log("HEALTH DB:", JSON.parse(data));
  });
});

req.on("error", (e) => {
  console.error("Error making HTTP request to port 3000:", e);
});
