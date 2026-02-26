/**
 * Безопасная сериализация объектов, содержащих BigInt
 * (Next.js NextResponse.json нативно не поддерживает BigInt)
 */
export function serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === "bigint") {
        return obj.toString();
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => serializeBigInt(item));
    }

    if (typeof obj === "object") {
        if (obj instanceof Date) return obj.toISOString();
        const result: Record<string, any> = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = serializeBigInt(obj[key]);
            }
        }
        return result;
    }

    return obj;
}
