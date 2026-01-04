import { NextResponse } from "next/server";
import prisma from "../../../../prisma/prisma";


export async function POST(request: Request) {

  const body = await request.json();
  const email = body.email!;
  try {
    const chat = await prisma.chat.create({
      data: {
        User: {
          connectOrCreate: {
            where: { email: email },
            create: { 
              email: email
            },
          },
        },
        Mess: {
          create: [
            { text: body.text, type: "user" }
          ],
        },
      },
      include: { Mess: true },
    });

    return NextResponse.json({
      chatId: chat.id,
      messages: chat.Mess,
    });
  } catch (error) {
    console.error("Error creating the product", error);
    return NextResponse.error();
  }
}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const email = searchParams.get("email");
  try {
    const chat = await prisma.chat.findMany({
      where: {
        User: { email: email! }
      },
      include: {
        Mess: {
          where: { type: "user" },
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
        }
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error creating the product", error);
    return NextResponse.error();
  }
}
