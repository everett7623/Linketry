/**
 * Non-destructive console draft of recommended GitHub repository variables.
 * Does not write secrets or variables; callers keep --apply confirmation gates.
 */

/**
 * @param {{
 *   variables?: Record<string, string>;
 *   secrets?: string[];
 *   confirmation?: string;
 *   heading?: string;
 * }} options
 */
export function printGitHubEnvDraft({
  variables = {},
  secrets = [],
  confirmation = '',
  heading = 'Recommended GitHub env vars draft (non-destructive preview)',
} = {}) {
  console.log(heading);
  const entries = Object.entries(variables);
  if (entries.length === 0) {
    console.log('  (no variable values ready yet — finish bootstrap apply first)');
  } else {
    for (const [name, value] of entries) {
      console.log(`  ${name}=${value}`);
    }
  }
  if (secrets.length > 0) {
    console.log('Required secrets (enter via hidden prompts / GitHub secret store; never printed):');
    for (const name of secrets) {
      console.log(`  ${name}=<set separately>`);
    }
  }
  if (confirmation) {
    console.log(`Confirmation phrase (required for --apply): ${confirmation}`);
  }
  console.log('This draft does not write GitHub or Cloudflare state.');
}
