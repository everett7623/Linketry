import { pathToFileURL } from 'node:url';

export function hasPagesProject(source, projectName) {
  const payload = JSON.parse(source);
  const projects = Array.isArray(payload) ? payload : payload?.result;
  if (!Array.isArray(projects)) throw new Error('Invalid Cloudflare Pages project inventory.');
  return projects.some((project) =>
    [project?.name, project?.['Project Name']].includes(projectName)
  );
}

async function readStdin() {
  let body = '';
  for await (const chunk of process.stdin) body += chunk;
  return body;
}

async function main() {
  const [argument, projectName, ...extra] = process.argv.slice(2);
  if (argument !== '--has' || !projectName || extra.length > 0) {
    throw new Error('Usage: pages-project-inventory --has <project-name>');
  }
  process.exitCode = hasPagesProject(await readStdin(), projectName) ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  });
}
