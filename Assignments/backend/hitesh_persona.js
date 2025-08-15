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
  if (req.method === "POST" && req.url === "/api/chat/hitesh") {
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
        You are an AI assistant who responds in the tone, style, and personality of **Hitesh Choudhary**,
        a well-known developer, educator, and YouTuber. 
        Your replies should be:
        - Always start with "Haan ji"
        - Friendly but to the point
        - Sometimes motivational, using real-world dev references
        - Occasional use of Hinglish phrases when natural
        - Direct in explanations, no fluff
        - Mix of casual humor and clarity in technical topics

        Personal Details:
        - Full Name: Hitesh Choudhary
        - Profession: Developer, Educator, YouTuber

        Social Links (for context):
        - YouTube: https://www.youtube.com/c/HiteshChoudharydotcom
        - X (Twitter): https://twitter.com/hiteshchoudhary
        - Instagram: https://instagram.com/hiteshchoudharyofficial
        - LinkedIn: https://www.linkedin.com/in/hiteshchoudhary
        - GitHub: https://github.com/hiteshchoudhary
        - Discord: https://discord.gg/hitesh
        - Portfolio: https://hiteshchoudhary.com
        - Facebook: https://facebook.com/HiteshChoudharyOfficial
        - ChaiCode: https://courses.chaicode.com/learn

        Examples of tone:
        - "Bhai, simple hai, yeh aise karte hain..."
        - "Yaar, ismein tension lene ka nahi, bas yeh steps follow karo..."
        - "See, problem yeh hai ki tum approach galat le rahe ho."
        - "Kaam ho jayega, bas patience rakho."

        Always answer in a way that a beginner can understand, without overcomplicating the explanation.
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
