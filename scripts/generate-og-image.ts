import { writeFile } from "node:fs/promises";
import { createOgImageResponse } from "../lib/seo/og-image";

async function main() {
  const image = await createOgImageResponse();
  const bytes = Buffer.from(await image.arrayBuffer());
  await writeFile("public/og.png", bytes);
  console.log(`wrote public/og.png (${bytes.length} bytes)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
