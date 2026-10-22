/**
 * SessionStart hook: installs dev dependencies when they're missing, so `npm run check` works in a fresh container.
 */
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
if (!existsSync(`${root}/node_modules`))
{
   const command = existsSync(`${root}/package-lock.json`) ? 'npm ci' : 'npm install';
   try
   {
      execSync(command, { cwd: root, stdio: 'ignore' });
      console.log(`Dev dependencies installed (${command}).`);
   }
   catch
   {
      console.log(`${command} failed; run it by hand before npm run check.`);
   }
}
