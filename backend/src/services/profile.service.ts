import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { ProfileQuery } from "../types/profile";

export async function searchProfiles(query: ProfileQuery) {
  const { q, skill, jobTitle, page, limit } = query;
  const search = q ? [
    { name: { contains: q, mode: "insensitive" as const } },
    { headline: { contains: q, mode: "insensitive" as const } },
    { location: { contains: q, mode: "insensitive" as const } },
    { summary: { contains: q, mode: "insensitive" as const } },
    { jobTitle: { contains: q, mode: "insensitive" as const } },
    { skills: { some: { skill: { name: { contains: q, mode: "insensitive" as const } } } } },
    { experiences: { some: { OR: [
      { title: { contains: q, mode: "insensitive" as const } },
      { company: { contains: q, mode: "insensitive" as const } }
    ] } } },
    { education: { some: { institution: { contains: q, mode: "insensitive" as const } } } }
  ] : undefined;

  const where: Prisma.ProfileWhereInput = {
    AND: [
      ...(search ? [{ OR: search }] : []),
      ...(skill ? [{ skills: { some: { skill: { name: { contains: skill, mode: "insensitive" as const } } } } }] : []),
      ...(jobTitle ? [{
        OR: [
          { jobTitle: { contains: jobTitle, mode: "insensitive" as const } },
          { experiences: { some: { title: { contains: jobTitle, mode: "insensitive" as const } } } }
        ]
      }] : [])
    ]
  };
  const [total, data] = await prisma.$transaction([
    prisma.profile.count({ where }),
    prisma.profile.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: "asc" },
      include: {
        skills: { include: { skill: true } },
        experiences: { orderBy: { startDate: "desc" } },
        education: { orderBy: { startDate: "desc" } }
      }
    })
  ]);

  return {
    data: data.map((profile) => ({
      ...profile,
      skills: profile.skills.map(({ skill }) => skill.name)
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}
