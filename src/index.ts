import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import uploadRoute from "./routes/upload";
import queryRoute from "./routes/query";
import saveNoteRoute from "./routes/saveNote";
import loginRoute from "./routes/login";
import chatRoute from "./routes/chat";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/upload", uploadRoute);
app.use("/api/query", queryRoute);
app.use("/api/save-note", saveNoteRoute);
app.use("/api/login", loginRoute);
app.use( "/api/chat", chatRoute);


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
