/**
 * PostToolUse hook on Edit and Write: lints the JavaScript file just changed, so a mistake shows at once.
 * Exit 2 hands the errors back to Claude; anything else stays quiet.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const file = input.tool_input?.file_path ?? '';
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
if (/\.m?js$/.test(file) && file.startsWith(root) && !file.includes('/node_modules/'))
{
   try
   {
      execFileSync('npx', ['--no-install', 'eslint', file], { cwd: root, encoding: 'utf8' });
   }
   catch (err)
   {
      if (err.stdout) { console.error(err.stdout); process.exit(2); }
   }
}
