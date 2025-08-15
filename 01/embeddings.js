import "dotenv/config";
import { OpenAI } from "openai";

const client = new OpenAI();

async function init() {
  const result = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: "I love to visit India",
    encoding_format: "float",
  });
  console.log(result.data[0].embedding.length);
}

init();
