import { OllamaService } from "../services/ollama_service";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { formatDocumentsAsString } from "langchain/util/document"
import { AIMessage, AIMessageChunk, BaseMessageChunk, HumanMessage } from "@langchain/core/messages";
import { ChatMessage } from "../models/chat_message";
import { ChromaService } from "../services/chroma_service";
import { SenderType } from "../enums/sender_type";
import { Chat } from "../models/chat";
import { IterableReadableStream } from "@langchain/core/dist/utils/stream";

export const getRagChain = (template: string, chatMessages: ChatMessage[]) => RunnableSequence.from([
    {
        context: async (input, callbacks) => {
            const chroma = await ChromaService.getInstance();
            const retriever = chroma.asRetriever();
            const retrieverAndFormatter = retriever.pipe(formatDocumentsAsString);
            return retrieverAndFormatter.invoke(input.question, callbacks);
        },
        question: (input) => input.question,
    },
    ChatPromptTemplate.fromMessages([
        ["system", template],
        ...chatMessages.map(message => {
            switch(message.sender) {
                case SenderType.AI: return new AIMessage(message.content);
                case SenderType.HUMAN: return new HumanMessage(message.content);
            }
        }),
        [SenderType.HUMAN.toString(), "{question}"]
    ]),
    OllamaService.getInstance()
]);

export const transformStream = (stream: IterableReadableStream<BaseMessageChunk>, chat: Chat) => {
    const transformedStream = getTransformedStream(stream, chat);
    if(chat.name !== null) return transformedStream;
    return getNewChatNameStream(transformedStream, chat);
}

const getTransformedStream = (stream: ReadableStream<BaseMessageChunk>, chat: Chat): ReadableStream<string> => {
    const answerChunks: string[] = [];
    const reader = stream.getReader();
    let isCanceled = false;
    return new ReadableStream<string>({
        async pull(controller) {
            const { done, value } = await reader.read();
            if(done || isCanceled) {
                controller.close();
                await chat.addMessage(SenderType.AI, answerChunks.join(""));
                return;
            }
            const answerChunk = value.content as string;
            answerChunks.push(answerChunk);
            console.log(answerChunk);
            controller.enqueue(JSON.stringify({ answer: answerChunk }));
        },
        async cancel() {
            await reader.cancel();
            isCanceled = true;
        }
    });
};

const getNewChatNameStream = (stream: ReadableStream<string>, chat: Chat) => {
    const ollama = OllamaService.getInstance();
    const answerChunks: string[] = [];
    const buffer: string[] = [];
    const reader = stream.getReader();
    let isCanceled = false;
    return new ReadableStream<string>({
        async pull(controller) {
            const { done, value } = await reader.read();
            if(done || isCanceled) {
                answerChunks.push(buffer[0]);
                const summary: string = (await ollama.invoke(`Summarize this answer into 3 words: ${answerChunks.join("")}`)).content as string;
                await Chat.update({ id: chat.id }, { name: summary });
                controller.enqueue(JSON.stringify({ answer: buffer[0], newChatName: summary }));
                controller.close();
                return;
            }
            const answerChunk = JSON.parse(value).answer;
            buffer.push(answerChunk);
            if (buffer.length <= 1) return;
            answerChunks.push(buffer[0]);
            controller.enqueue(JSON.stringify({ answer: buffer[0] }));
            buffer.shift();
        },
        async cancel() {
            await reader.cancel();
            isCanceled = true;
        }
    });
}