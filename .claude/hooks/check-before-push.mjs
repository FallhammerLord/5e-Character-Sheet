/**
 * PreToolUse hook on Bash: runs `npm run check` before any git push and blocks the push if it fails.
 * Exit 2 blocks the command and hands the output back to Claude.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
if (/\bgit\s+push\b/.test(input.tool_input?.command ?? ''))
{
   try
   {
      execSync('npm run check', { cwd: process.env.CLAUDE_PROJECT_DIR ?? process.cwd(), encoding: 'utf8', stdio: 'pipe' });
   }
   catch (err)
   {
      console.error(`Push blocked: npm run check failed.\n${err.stdout ?? ''}${err.stderr ?? ''}`);
      process.exit(2);
   }
}
