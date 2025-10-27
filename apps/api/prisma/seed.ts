import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "primary" },
    update: {},
    create: {
      slug: "primary",
      name: "NeonHub",
      plan: "scale",
      settings: {
        timezone: "UTC",
        theme: "neon",
      },
    },
  });

  await prisma.brand.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "neonhub",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      slug: "neonhub",
      name: "NeonHub",
      description: "Default brand for NeonHub",
      mainColor: "#2B26FE",
      slogan: "Stay Neon!",
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@neonhub.ai" },
    update: {},
    create: {
      email: "admin@neonhub.ai",
      name: "NeonHub Admin",
      emailVerified: new Date(),
      isBetaUser: true,
    },
  });

  await prisma.organizationMembership.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: adminUser.id,
      },
    },
    update: {
      status: "active",
    },
    create: {
      organizationId: organization.id,
      userId: adminUser.id,
      status: "active",
    },
  });

  // Additional seed data (agents, campaigns, etc.) can be added here as needed.
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
