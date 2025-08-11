import { Router } from "express";
import { openai } from "../lib/openai";
import { supabase } from "../lib/supabase";

const router = Router();

router.post("/", async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== "string") {
            return res.status(400).json({ error: "'query' Field is required and it should be a text" });
        }
        let embedRes;
        try {
            embedRes = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: query,
            });
        } catch (err: any) {
            console.error("Error en OpenAI embeddings:", err);
            return res.status(502).json({ error: "Error creating embedding with OpenAI." });
        }
        const queryEmbedding = embedRes.data[0]?.embedding;
        if (!queryEmbedding) {
            return res.status(500).json({ error: "Error fetching embedding." });
        }
        const { data, error } = await supabase.rpc("match_documents", {
            query_embedding: queryEmbedding,
            match_count: 3
        });
        if (error) {
            console.error("Error Supabase RPC:", error);
            return res.status(502).json({ error: "Error in database." });
        }
        const context = (data || [])
            .map((d: any) => d.content)
            .join("\n");
        let chatRes;
        try {
            chatRes = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "Responde usando solo la información del contexto. Si no está, dilo claramente."
                    },
                    {
                        role: "user",
                        content: `Contexto:\n${context}\n\nPregunta: ${query}`
                    }
                ],
            });
        } catch (err: any) {
            console.error("Error in OpenAI chat:", err);
            return res.status(502).json({ error: "Error fetching answer de OpenAI." });
        }
        const answer = chatRes.choices[0]?.message?.content || "I cant generate an answer for that.";
        res.json({ answer, context });
    } catch (err: any) {
        console.error("Error in query:", err);
        res.status(500).json({ error: "Error." });
    }
});

export default router;
