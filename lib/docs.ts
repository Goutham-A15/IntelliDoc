import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDirectory = path.join(process.cwd(), "content/docs");

export interface Doc {
  title: string;
  slug: string;
  section: string;
  order: number;
  excerpt: string;
  content: string;
}

export function getAllDocs(): Doc[] {
  const allFiles = fs.readdirSync(contentDirectory);

  const docs = allFiles
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const filePath = path.join(contentDirectory, file);
      const fileContents = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        title: data.title,
        slug: data.slug,
        section: data.section,
        order: data.order,
        excerpt: data.excerpt,
        content,
      } as Doc;
    });

  return docs.sort((a, b) => a.order - b.order);
}

export function getDocBySlug(slug: string): Doc | null {
  const filePath = path.join(contentDirectory, `${slug}.md`);

  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);
    
    return {
        title: data.title,
        slug: data.slug,
        section: data.section,
        order: data.order,
        excerpt: data.excerpt,
        content,
    } as Doc;
  } catch (err) {
      return null;
  }
}