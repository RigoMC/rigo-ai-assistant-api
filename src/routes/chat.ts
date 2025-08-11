import { Router } from "express";
import { supabase } from "../lib/supabase";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/", authMiddleware, async (req: AuthRequest, res) => {
    const { title } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ error: "User not authenticated" });

    const { data, error } = await supabase
        .from("chats")
        .insert([{ user_id: userId, title }])
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

router.post("/:chatId/messages", authMiddleware, async (req: AuthRequest, res) => {
    const { role, content } = req.body;
    const { chatId } = req.params;

    const { data, error } = await supabase
        .from("chat_messages")
        .insert([{ chat_id: chatId, role, content }])
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

export default router;
