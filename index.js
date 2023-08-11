import express from 'express'
import dotenv from 'dotenv'
import { RetrievalQAChain, loadQAStuffChain } from "langchain/chains";
import {appwriteDocsStore, utopiaPhpDocStore} from './vector_dance.js';
import { PromptTemplate } from 'langchain/prompts';
import { OpenAI } from 'langchain/llms/openai';

dotenv.config()

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const model = new OpenAI({
  openAIApiKey: OPENAI_API_KEY,
  modelName: "gpt-3.5-turbo",
  temperature: 0,
})

let retrievedAppwriteVectorStore = false
let appwriteVectorStore = null
let appwriteChain = null
let retrievedUtopiaPhpVectorStore = false
let utopiaPhpVectorStore = null
let utopiaPhpChain = null

async function loadVectorStores() {
  
  const promptTemplate = `You are an AI chat bot trained on chats on Appwrite Support Discord Channel. You need to help developers answer Appwrite related
  question only. You will be given an input and you need to respond with the appropriate answer from the
  reference docs.

       Question: {question}`;
  
       const prompt = PromptTemplate.fromTemplate(promptTemplate);

       const utopiaPromptTemplate = `Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.
       You are a chatbot for utopia-php a php framework. I have fed documents using langchain try to use them to answer the questions .utopia-php has mutiple frameworks under it.

       Question: {question}`;
  
       const utopiaPrompt = PromptTemplate.fromTemplate(promptTemplate);
  
  appwriteDocsStore.then((vectorStore) => {
    appwriteVectorStore = vectorStore
    retrievedAppwriteVectorStore = true
    appwriteChain = new RetrievalQAChain({
      combineDocumentsChain: loadQAStuffChain(model, { prompt }),
      retriever: appwriteVectorStore.asRetriever(),
    });
    console.log("Support(Archive) vectors loaded")
  })

  utopiaPhpDocStore.then((vectorStore)=>{
    utopiaPhpVectorStore = vectorStore
    retrievedUtopiaPhpVectorStore = true
    utopiaPhpChain = new RetrievalQAChain({
      combineDocumentsChain: loadQAStuffChain(model, { utopiaPrompt }),
      retriever: utopiaPhpVectorStore.asRetriever(),
    });
    console.log("Utopia PHP vector store loaded")
  })

}

loadVectorStores()

const app = express()
app.use(express.json())

app.post('/appwrite', async (req, res) => {
  const question = req.body.question
  if (retrievedAppwriteVectorStore) {
    await appwriteChain.call({
      query: question,
    }).then((answer)=>{
    res.send(answer);
    console.log(answer.text);
    })
  }
  else {
    res.send("Appwrite vector store not loaded yet")
  }

})

app.post('/utopia-php', async (req, res) => {
  const question = req.body.question
  if (retrievedUtopiaPhpVectorStore) {
    await utopiaPhpChain.call({
      query: question,
    }).then((answer)=>{
    res.send(answer);
    console.log(answer.text);
    }
    )
  }
  else {
    res.send("Utopia Vector Store not loaded yet")
  }

})

const port = process.env.PORT || 8182

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
}
)