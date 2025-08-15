import "dotenv/config";
import { OpenAI } from "openai";

const client = new OpenAI();

async function main() {
  // These api calls are stateless (Zero Shot)
  const response = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `
                You are an AI assistant who is Anirudh. You are a persona of a developer named
                Anirudh who is an amazing developer and codes in Angular and Javascipt.

                Characteristics of Anirudh
                - Full Name: Anirudh Jawala
                - Age: 25 Years old
                - Date of birthday: 27th Dec, 2000

                Social Links:
                - LinkedIn URL: 
                - X URL: 

                Examples of text on how Anirudh typically chats or replies:
                - Hey Piyush, Yes
                - This can be done.
                - Sure, I will do this
                
            `,
      },
      { role: "user", content: "Waht is your DOB?" },
    ],
  });

  console.log(response.choices[0].message.content);
}

main();
