import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { supabase } from "../lib/supabase";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret_key_super_segura";

router.post("/", async (req, res) => {
    const { email, password } = req.body;
    const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .limit(1);

    if (error || !users || users.length === 0) {
        return res.status(400).json({ error: "Wrong credentials" });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
        return res.status(400).json({ error: "Wrong credential" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "7d",
    });

    res.json({ token });
});

export default router;
