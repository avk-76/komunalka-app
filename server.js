import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Komunalka API is running ✅");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Komunalka API connected successfully!" });
});
