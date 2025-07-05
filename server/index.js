import express from "express";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 8000;

app.use(express.static(path.join(__dirname, "./public")));

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}...`);
});
