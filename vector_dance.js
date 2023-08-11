import dotenv from 'dotenv'
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
dotenv.config()

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const embeddings = new OpenAIEmbeddings({
    openAIApiKey: OPENAI_API_KEY,
})

const appwriteDocsStore = new Promise((resolve, reject) => {
    const loader = new TextLoader("./support-archive/archive-support.txt");
loader.load().then(async (data) => {
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 64,
    });
    textSplitter.splitDocuments(data).then(async(documents)=>{
        let appwriteStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
        resolve(appwriteStore);
      })
})
})

const utopiaPhpDocStore = new Promise ((resolve, reject)=>{
    const loader = new TextLoader("./utopia-php/utopia-php.md")
    loader.load().then(async(data)=>{
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 500,
            chunkOverlap: 0,
        });
        textSplitter.splitDocuments(data).then(async(documents)=>{
            let utopiaPhpStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
            resolve(utopiaPhpStore);
        })
    })
})

export { appwriteDocsStore, utopiaPhpDocStore}