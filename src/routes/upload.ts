import { Router } from "express";
import formidable, { File as FormidableFile, Fields, Files } from "formidable";
import fs from "fs";
import path from "path";
import { chunkText } from "../lib/chunk";
import { embedTexts } from "../lib/openai";
import { supabase } from "../lib/supabase";

const router = Router();

router.post("/", async (req, res) => {
    const form = formidable({
        multiples: false,
        maxFileSize: 5 * 1024 * 1024, // 5MB límite
        filter: ({ mimetype }) => !!mimetype && mimetype.includes("text/plain"),
    });

    form.parse(req, async (err: Error | null, fields: Fields, files: Files) => {
        try {
            if (err) {
                return res.status(400).json({ error: `Error with the file: ${err.message}` });
            }
            const uploadedFile: FormidableFile | undefined = Array.isArray(files.file)
                ? files.file[0]
                : (files.file as FormidableFile | undefined);
            if (!uploadedFile) {
                return res.status(400).json({ error: "No file uploaded" });
            }
            const ext = path.extname(uploadedFile.originalFilename || "").toLowerCase();
            if (ext !== ".txt") {
                return res.status(400).json({ error: "Only uses text files (.txt)" });
            }
            const text = await fs.promises.readFile(uploadedFile.filepath, "utf-8");
            if (!text.trim()) {
                return res.status(400).json({ error: "The file is empty" });
            }
            const chunks = chunkText(text);
            const { data: existingDocs, error: selectError } = await supabase
                .from("documents")
                .select("content");
            if (selectError) {
                return res.status(500).json({ error: `Error fetching database: ${selectError.message}` });
            }
            const existingContents = new Set(existingDocs?.map(d => d.content.trim()) || []);
            const newChunks = chunks.filter(c => !existingContents.has(c.trim()));
            if (newChunks.length === 0) {
                return res.status(200).json({
                    message: "All the content are already in database, nothing new to insert.",
                    inserted: 0
                });
            }
            const embeddings = await embedTexts(newChunks);
            const { error: insertError } = await supabase.from("documents").insert(
                newChunks.map((c, i) => ({
                    content: c,
                    metadata: { filename: uploadedFile.originalFilename },
                    embedding: embeddings[i]
                }))
            );
            if (insertError) {
                return res.status(500).json({ error: `Error while saving in database: ${insertError.message}` });
            }
            res.json({
                message: "File saved successfully",
                inserted: newChunks.length,
                skipped: chunks.length - newChunks.length
            });
        } catch (error: any) {
            console.error("Error en /upload:", error);
            res.status(500).json({ error: "Server error" });
        }
    });
});

export default router;
