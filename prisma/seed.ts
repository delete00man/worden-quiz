import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
    const hashedPassword = await bcrypt.hash("admin123", 10)

    const admin = await prisma.user.upsert({
        where: { email: "arthushaulot@gmail.com" },
        update: {},
        create: {
            name: "Arthus",
            email: "arthushaulot@gmail.com",
            password: hashedPassword,
            isAdmin: true,
        },
    })

    console.log("✅ Admin créé:", admin.email)

    // Check if sample level exists
    const existingLevel = await prisma.level.findFirst({
        where: { name: "Vocabulaire de base" },
    })

    if (!existingLevel) {
        const level = await prisma.level.create({
            data: {
                name: "Vocabulaire de base",
                description: "Les mots essentiels du néerlandais",
                published: true,
                flashcards: {
                    create: [
                        { front: "huis", back: "maison", order: 0 },
                        { front: "kat", back: "chat", order: 1 },
                        { front: "hond", back: "chien", order: 2 },
                        { front: "boom", back: "arbre", order: 3 },
                        { front: "water", back: "eau", order: 4 },
                    ],
                },
            },
        })
        console.log("✅ Niveau créé:", level.name, "- avec 5 flashcards")
    } else {
        console.log("ℹ️  Niveau existant:", existingLevel.name)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
