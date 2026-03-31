import express from "express";
import { matchesRouter } from "./routes/matches";

const app = express();
const PORT = 8000;

// Use JSON middleware
app.use(express.json());

// Root GET route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Real-Time Sport Broadcast Server!" });
});

app.use("/matches", matchesRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
