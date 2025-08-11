import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function embedTexts(texts: string[]) {
    const res = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
    });
    return res.data.map(d => d.embedding);
}
