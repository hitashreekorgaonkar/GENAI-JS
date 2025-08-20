import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { RecursiveUrlLoader } from "@langchain/community/document_loaders/web/recursive_url";
import { compile } from "html-to-text";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import OpenAI from "openai";

const app = express();
const port = process.env.PORT || 3000;
const upload = multer({ dest: "uploads/" });
const compiledConvert = compile({ wordwrap: 130 });
const openaiClient = new OpenAI();

app.use(cors());
app.use(express.json());

// --- Create document from user text ---
function createDocumentFromText(text, metadata = {}) {
  return { pageContent: text, metadata };
}

// --- Load documents from all sources ---
async function loadDocuments({ pdfPath, csvPath, websiteUrl, textContent }) {
  let docs = [];

  if (pdfPath && fs.existsSync(pdfPath)) {
    const pdfLoader = new PDFLoader(pdfPath);
    const pdfDocs = await pdfLoader.load();
    const pdfSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 3000,
      chunkOverlap: 300,
    });
    const splitPdf = await pdfSplitter.splitDocuments(
      pdfDocs.map((doc) => ({
        ...doc,
        metadata: { ...doc.metadata, source: "PDF" },
      }))
    );
    docs = docs.concat(splitPdf);
  }

  if (csvPath && fs.existsSync(csvPath)) {
    const csvLoader = new CSVLoader(csvPath);
    const csvDocs = await csvLoader.load();
    const csvSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 100,
    });
    const splitCsv = await csvSplitter.splitDocuments(
      csvDocs.map((doc) => ({
        ...doc,
        metadata: { ...doc.metadata, source: "CSV" },
      }))
    );
    docs = docs.concat(splitCsv);
  }

  if (websiteUrl) {
    const webLoader = new RecursiveUrlLoader(websiteUrl, {
      extractor: compiledConvert,
      maxDepth: 1,
      excludeDirs: [],
    });
    const webDocs = await webLoader.load();
    const webSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 4000,
      chunkOverlap: 400,
    });
    const splitWeb = await webSplitter.splitDocuments(
      webDocs.map((doc) => ({
        ...doc,
        metadata: { ...doc.metadata, source: "Website", url: websiteUrl },
      }))
    );
    docs = docs.concat(splitWeb);
  }

  if (textContent) {
    docs.push(createDocumentFromText(textContent, { source: "User-text" }));
  }

  return docs;
}

// --- Indexing endpoint ---
app.post(
  "/api/index",
  upload.fields([{ name: "pdf" }, { name: "csv" }]),
  async (req, res) => {
    try {
      const pdfFile = req.files?.pdf?.[0]?.path || null;
      const csvFile = req.files?.csv?.[0]?.path || null;
      const websiteUrl = req.body.websiteUrl || null;
      const textContent = req.body.textContent || null;

      const docs = await loadDocuments({
        pdfPath: pdfFile,
        csvPath: csvFile,
        websiteUrl,
        textContent,
      });

      if (!docs.length)
        return res.status(400).json({ message: "No documents provided!" });

      const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-large",
        apiKey: process.env.OPENAI_API_KEY,
      });

      await QdrantVectorStore.fromDocuments(docs, embeddings, {
        url: "http://localhost:6333",
        collectionName: "user-uploaded-docs",
      });

      res.json({ message: "Indexing completed!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

// --- Chat endpoint ---
app.post("/api/chat", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: "Query is required!" });

    const embeddings = new OpenAIEmbeddings({
      model: "text-embedding-3-large",
      apiKey: process.env.OPENAI_API_KEY,
    });
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: "http://localhost:6333",
        collectionName: "user-uploaded-docs",
      }
    );

    const retriever = vectorStore.asRetriever({ k: 5 });
    const relevantChunks = await retriever.getRelevantDocuments(query);

    const SYSTEM_PROMPT = `
You are an expert AI assistant. Answer user queries based ONLY on the following context:

${relevantChunks
  .map(
    (c) =>
      `Source: ${c.metadata.source || "unknown"}${
        c.metadata.page ? ", Page: " + c.metadata.page : ""
      }${c.metadata.url ? ", URL: " + c.metadata.url : ""}\nContent: ${
        c.pageContent
      }\n`
  )
  .join("\n---\n")}
`;

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
    });

    res.json({ answer: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Test root ---
app.get("/", (req, res) => {
  res.send("RAG backend is running!");
});

app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`)
);
