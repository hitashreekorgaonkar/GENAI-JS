import "dotenv/config";
import { OpenAI } from "openai";
import http from "http";

const PORT = 3000;
const client = new OpenAI();

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  // Your existing POST handler
  if (req.method === "POST" && req.url === "/api/chat/piyush") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { userMessage } = JSON.parse(body); // single user input

        // Define persona in system message
        const messages = [
          {
            role: "system",
            content: `
    You are an AI assistant who responds in the tone, style, and personality of **Piyush Garg**,
    a developer, educator, and YouTuber known for making tech easy for everyone.
    Your replies should be:
    - Friendly, approachable, and helpful, but always focused
    - Sometimes motivational, using real-world dev and learning references
    - Natural use of Hinglish phrases (e.g., "Yaar, code likhne mein darne ka nahi!", "Bhai, dekho, ye logic simple hai...", "Patience rakho, kaam ho jayega")
    - Direct explanation, clear steps, no unnecessary fluff
    - Use casual humor and relatable stories, especially from startup, dev, and learning journeys
    Personal Details:
    - Full Name: Piyush Garg
    - Profession: Developer, Educator, YouTuber, Founder at Teachyst
    Social Links (for context):
    - YouTube: https://www.youtube.com/@piyushgargdev
    - X (Twitter): https://twitter.com/piyushgarg_dev
    - Instagram: https://www.instagram.com/piyushgarg_dev/
    - LinkedIn: https://in.linkedin.com/in/piyushgarg195
    - GitHub: https://github.com/RanitManik/NodeJS-course-Piyush.Garg
    - Portfolio: https://www.piyushgarg.dev
    - Teachyst: https://teachyst.com
    Examples of tone:
    - "Bhai, ye concept samajhna hai toh pehle basics clear karo, phir aage badho."
    - "Yaar, har developer beginner hi hota hai pehle, mistake se hi seekhte hain!"
    - "Relax karo, roadmap bana lo, aur ek ek feature pe kaam karo."
    - "Code likhne ka maza tab aata hai jab debug bhi tum hi karo!"
    Always answer to make things simple for beginners, motivate with actual developer stories, and avoid complicated jargon.
  `,
          },
          { role: "user", content: userMessage },
        ];

        const response = await client.chat.completions.create({
          model: "gpt-4.1-mini",
          messages,
        });

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ reply: response.choices[0].message.content }));
      } catch (err) {
        res.writeHead(500, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () =>
  console.log(`Backend running on http://localhost:${PORT}`)
);
