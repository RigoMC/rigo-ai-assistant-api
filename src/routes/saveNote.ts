import { Router } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

router.post("/", async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content)
        return res.status(400).json({ error: "Title and content are required" });

    const { error } = await supabase.from("notes").insert({ title, content });
    if (error) return res.status(500).json({ error: error.message });

    res.json({ message: "Note saved successfully" });
});

export default router;
