import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const tgIdStr = request.headers.get("x-telegram-id");
    if (!tgIdStr) return NextResponse.json({ error: "Missing x-telegram-id" }, { status: 400 });

    try {
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(tgIdStr) },
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        return NextResponse.json({ notifications }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const tgIdStr = request.headers.get("x-telegram-id");
    if (!tgIdStr) return NextResponse.json({ error: "Missing x-telegram-id" }, { status: 400 });

    try {
        const { notificationId } = await request.json();

        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
