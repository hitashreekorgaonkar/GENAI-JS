import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";

const enc = new Tiktoken(o200k_base);

const userQuery = "Hello, Hita here!";
const tokens = enc.encode(userQuery);
console.log({ tokens });

const inputTokens = [13225, 11, 487, 2580, 2105, 0];
const decoded = enc.decode(inputTokens);
console.log({ decoded });

function predictNextToken(tokens) {
  // Code
  return 487;
}

// while (true) {
//   const nextToken = predictNextToken(tokens);
//   if (nextToken === "END") break;
//   tokens.push(nextToken);
// }
