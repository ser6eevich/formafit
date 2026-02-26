import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET(request: Request) {
    const tgIdStr = request.headers.get("x-telegram-id");

    if (!tgIdStr) {
        return NextResponse.json({ error: "Missing x-telegram-id header" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(tgIdStr) },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user: serializeBigInt(user) }, { status: 200 });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const tgIdStr = request.headers.get("x-telegram-id") || body.telegramId;

        if (!tgIdStr) {
            return NextResponse.json({ error: "Missing x-telegram-id header" }, { status: 400 });
        }

        const {
            username,
            firstName,
            gender,
            birthDate,
            weight,
            height,
            goal,
            injuries,
            experience,
            notificationsEnabled,
            alwaysAddPool,
            photoUrl,
        } = body;

        const telegramIdBigInt = BigInt(tgIdStr);

        const upsertedUser = await prisma.user.upsert({
            where: { telegramId: telegramIdBigInt },
            update: {
                username,
                firstName,
                photoUrl,
                gender,
                birthDate,
                weight: weight ? Number(weight) : undefined,
                height: height ? Number(height) : undefined,
                goal,
                injuries,
                experience,
                notificationsEnabled: notificationsEnabled !== undefined ? Boolean(notificationsEnabled) : undefined,
                alwaysAddPool: alwaysAddPool !== undefined ? Boolean(alwaysAddPool) : undefined,
            },
            create: {
                telegramId: telegramIdBigInt,
                username,
                firstName,
                photoUrl,
                gender,
                birthDate,
                weight: weight ? Number(weight) : null,
                height: height ? Number(height) : null,
                goal,
                injuries,
                experience,
                notificationsEnabled: notificationsEnabled !== undefined ? Boolean(notificationsEnabled) : true,
                alwaysAddPool: alwaysAddPool !== undefined ? Boolean(alwaysAddPool) : false,
            },
        });

        return NextResponse.json({ user: serializeBigInt(upsertedUser) }, { status: 200 });
    } catch (error) {
        console.error("Error saving user:", error);
        return NextResponse.json({ error: "Failed to save user" }, { status: 500 });
    }
}
