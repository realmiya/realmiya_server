import express from "express";
import cors from "cors";
import records from "./routes/record.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());
app.use("/record", records);

app.use("/", express.static(path.join(__dirname, "public")));

// start the Express server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
