import "dotenv/config";
import { prisma } from "../src/db/prisma";
import { readDataset, parseStructured, text, ParsedEducation, ParsedExperience } from "../src/utils/dataset";

const datasetPath = process.env.DATASET_PATH;
const bounded = (value: string | undefined, maxLength: number) => value?.slice(0, maxLength);

async function seed() {
  const rows = await readDataset(datasetPath);
  let imported = 0;
  let skipped = 0;
  const sourceKeys = rows
    .map((row, index) => text(row.linkedin_id) ?? text(row.linkedin_url) ?? `${text(row.full_name) ?? "unknown"}:${index}`)
    .filter((key): key is string => Boolean(key));

  const removed = await prisma.profile.deleteMany({
    where: { sourceKey: { notIn: sourceKeys } }
  });
  if (removed.count > 0) {
    console.log(`Removed ${removed.count} profiles not present in the source dataset.`);
  }

  for (const [index, row] of rows.entries()) {
    const name = text(row.full_name);
    const sourceKey = text(row.linkedin_id) ?? text(row.linkedin_url) ?? `${name ?? "unknown"}:${index}`;
    if (!name) {
      skipped += 1;
      continue;
    }

    const profile = await prisma.profile.upsert({
      where: { sourceKey },
      update: {
        name: bounded(name, 300) ?? name,
        headline: bounded(text(row.headline), 1000),
        jobTitle: bounded(text(row.job_title), 300),
        location: bounded(text(row.location_name), 300),
        summary: bounded(text(row.summary), 10000),
        linkedinUrl: bounded(text(row.linkedin_url), 1000),
        skills: { deleteMany: {}, create: [] },
        experiences: { deleteMany: {} },
        education: { deleteMany: {} }
      },
      create: {
        sourceKey,
        name: bounded(name, 300) ?? name,
        headline: bounded(text(row.headline), 1000),
        jobTitle: bounded(text(row.job_title), 300),
        location: bounded(text(row.location_name), 300),
        summary: bounded(text(row.summary), 10000),
        linkedinUrl: bounded(text(row.linkedin_url), 1000)
      }
    });

    const skillNames = [...new Set((parseStructured<string[]>(row.skills) ?? []).map(text).filter((value): value is string => Boolean(value)))];
    for (const skillName of skillNames) {
      const skill = await prisma.skill.upsert({ where: { name: skillName.toLowerCase() }, update: {}, create: { name: skillName.toLowerCase() } });
      await prisma.profileSkill.create({ data: { profileId: profile.id, skillId: skill.id } });
    }

    const experiences = parseStructured<ParsedExperience[]>(row.experience);
    if (Array.isArray(experiences)) {
      await prisma.experience.createMany({
        data: experiences.map((item) => ({
          profileId: profile.id,
          company: text(item.company?.name),
          title: text(item.title),
          startDate: text(item.start_date),
          endDate: text(item.end_date),
          summary: text(item.summary)
        })).filter((item) => item.company || item.title || item.summary)
      });
    }

    const education = parseStructured<ParsedEducation[]>(row.education);
    if (Array.isArray(education)) {
      await prisma.education.createMany({
        data: education.map((item) => ({
          profileId: profile.id,
          institution: text(item.school?.name),
          degree: item.degrees?.filter(Boolean).join(", ") || undefined,
          major: item.majors?.filter(Boolean).join(", ") || undefined,
          startDate: text(item.start_date),
          endDate: text(item.end_date),
          summary: text(item.summary)
        })).filter((item) => item.institution || item.degree || item.major || item.summary)
      });
    }
    imported += 1;
  }

  console.log(`Imported ${imported} profiles from ${rows.length} dataset rows; skipped ${skipped}.`);
  console.log(`Database now contains ${await prisma.profile.count()} profiles.`);
}

seed().catch((error) => {
  console.error("Dataset import failed:", error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
