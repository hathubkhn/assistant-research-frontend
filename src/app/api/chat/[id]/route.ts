import { NextResponse } from "next/server";
import prisma from "../../../../../prisma/prisma";
const FLASK_API_URL = process.env.FLASK_API_URL || "http://127.0.0.1:8000/chat";

export async function GET(
  _: Request,
  { params }: any
) {
  const { id } = await params;
  try {
    const data = await prisma.chat.findFirst({
      where: {
        id: id,
      },
      include: {
        Mess: {
          orderBy: {
            createdAt: "asc",
          },
          take: 10
        },
      }
    });
    return NextResponse.json(data);
  } catch (error) {
    console.log("Error creating the product", error);
    return NextResponse.error();
  }
}

export async function POST(request: Request, { params }: any) {
  const { id } = await params;
  const body = await request.json();
  const chatId = id;
  if (body.type.toLowerCase() === "bot") {
    await prisma.mess.create({
      data: {
        chatId,
        type: "bot",
        text: body.text,
      },
    });
    return NextResponse.json({ message: "Bot message recorded." });
  }

  const recentMessages = await prisma.mess.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const ordered = recentMessages.reverse();
  let historyString = "";
  let query = ""
  if (recentMessages.length == 1) {
    historyString = "";
    query = "" + recentMessages[0].text
  }
  else {
    historyString = ordered
      .map((m:any) => `${m.type === "bot" ? "Bot" : "User"}: ${m.text}`)
      .join("\n");
    query = body.text
    await prisma.mess.create({
      data: {
        chatId,
        type: body.type || "user",
        text: body.text,
      },
    });
  }
  const flaskRes = await fetch(FLASK_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: query, history: historyString }),
  });

  const stream = new ReadableStream({
    async start(controller) {
      const reader = flaskRes.body!.getReader();
      const decoder = new TextDecoder();
      let botReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        botReply += chunk;

        controller.enqueue(value);
      }

      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
    },
  });
}
export async function DELETE(
  _: Request,
  { params }: any
) {
  const { id } = await params;
  const chatId = id;

  try {
    const data = await prisma.chat.delete({
      where: {
        id: chatId,
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error creating or retrieving messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
