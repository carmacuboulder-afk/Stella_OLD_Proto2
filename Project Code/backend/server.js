import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let visits = 0;

app.get("/hello", (req, res) => {
  visits++;
  res.json({
    message: "Hello from the backend!",
    totalVisits: visits,
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
