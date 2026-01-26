#!/usr/bin/env node

/**
 * Create a pull request with automatic credential switching
 *
 * Usage:
 *   node scripts/create-pr.js [--title "PR title"] [--issue N]
 *
 * Options:
 *   --title   PR title (optional, will generate from commits if not provided)
 *   --issue   Issue number to link (optional, will auto-detect from branch name)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return result ? result.trim() : '';
  } catch (error) {
    if (options.ignoreError) {
      return null;
    }
    throw error;
  }
}

function execSilent(command, options = {}) {
  return exec(command, { ...options, silent: true });
}

function switchToBotCredentials() {
  log('\n→ Switching to bot credentials...', 'cyan');

  const homeDir = process.env.HOME;
  const tokenFile = path.join(homeDir, '.github-tokens');

  if (!fs.existsSync(tokenFile)) {
    throw new Error(`Token file not found: ${tokenFile}`);
  }

  // Source tokens and set credentials
  const tokens = fs.readFileSync(tokenFile, 'utf8');
  const botTokenMatch = tokens.match(/BOT_TOKEN=(.+)/);

  if (!botTokenMatch || !botTokenMatch[1]) {
    throw new Error('BOT_TOKEN not found in ~/.github-tokens');
  }

  const botToken = botTokenMatch[1].trim();

  execSilent('git config --global user.name "k5qkop-bot"');
  execSilent('git config --global user.email "tblz+k5qkop-bot@proton.me"');

  const credFile = path.join(homeDir, '.git-credentials');
  fs.writeFileSync(credFile, `https://k5qkop-bot:${botToken}@github.com\n`);

  log('✓ Switched to k5qkop-bot', 'green');
}

function switchToUserCredentials() {
  log('\n→ Switching back to user credentials...', 'cyan');

  const homeDir = process.env.HOME;
  const tokenFile = path.join(homeDir, '.github-tokens');

  if (!fs.existsSync(tokenFile)) {
    throw new Error(`Token file not found: ${tokenFile}`);
  }

  const tokens = fs.readFileSync(tokenFile, 'utf8');
  const userTokenMatch = tokens.match(/USER_TOKEN=(.+)/);

  if (!userTokenMatch || !userTokenMatch[1]) {
    throw new Error('USER_TOKEN not found in ~/.github-tokens');
  }

  const userToken = userTokenMatch[1].trim();

  execSilent('git config --global user.name "lexey"');
  execSilent('git config --global user.email "tblz@proton.me"');

  const credFile = path.join(homeDir, '.git-credentials');
  fs.writeFileSync(credFile, `https://AlexeyTuboltsev:${userToken}@github.com\n`);

  log('✓ Switched back to lexey', 'green');
}

function getCurrentBranch() {
  return execSilent('git rev-parse --abbrev-ref HEAD');
}

function getIssueNumberFromBranch(branch) {
  const match = branch.match(/^(\d+)-/);
  return match ? match[1] : null;
}

function hasUncommittedChanges() {
  const status = execSilent('git status --porcelain');
  return status.length > 0;
}

function getBranchRemoteStatus(branch) {
  const tracking = execSilent(`git rev-parse --abbrev-ref ${branch}@{upstream}`, {
    ignoreError: true
  });
  return tracking !== null;
}

function getCommitsSinceMain(branch) {
  try {
    return execSilent(`git log main..${branch} --oneline`);
  } catch {
    return execSilent(`git log --oneline -5`); // Fallback to last 5 commits
  }
}

function generatePRTitle(commits) {
  const lines = commits.split('\n').filter(l => l.trim());
  if (lines.length === 0) return 'Update code';

  // Use first commit message, remove hash
  const firstCommit = lines[0].replace(/^[a-f0-9]+\s+/, '');
  return firstCommit;
}

function generatePRBody(commits, issueNumber) {
  const lines = commits.split('\n').filter(l => l.trim());

  let body = '## Changes\n';

  // Add commit messages as bullet points
  lines.forEach(line => {
    const message = line.replace(/^[a-f0-9]+\s+/, '');
    body += `- ${message}\n`;
  });

  body += '\n';

  if (issueNumber) {
    body += `Fixes #${issueNumber}\n\n`;
  }

  body += '🤖 Generated with [Claude Code](https://claude.com/claude-code)';

  return body;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    title: null,
    issueNumber: null,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      result.title = args[i + 1];
      i++;
    } else if (args[i] === '--issue' && args[i + 1]) {
      result.issueNumber = args[i + 1];
      i++;
    }
  }

  return result;
}

async function main() {
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║     Create Pull Request (Bot Mode)    ║', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');

  try {
    // Parse arguments
    const args = parseArgs();

    // 1. Check current state
    log('\n→ Checking current state...', 'cyan');

    const currentBranch = getCurrentBranch();
    log(`  Branch: ${currentBranch}`, 'yellow');

    if (currentBranch === 'main') {
      throw new Error('Cannot create PR from main branch. Please create a feature branch first.');
    }

    if (hasUncommittedChanges()) {
      throw new Error('You have uncommitted changes. Please commit or stash them first.');
    }

    // Auto-detect issue number from branch name
    const issueNumber = args.issueNumber || getIssueNumberFromBranch(currentBranch);
    if (issueNumber) {
      log(`  Issue: #${issueNumber}`, 'yellow');
    }

    // 2. Get commits for PR description
    const commits = getCommitsSinceMain(currentBranch);

    // 3. Generate PR details
    const prTitle = args.title || generatePRTitle(commits);
    const prBody = generatePRBody(commits, issueNumber);

    log(`  Title: ${prTitle}`, 'yellow');

    // 4. Switch to bot credentials
    switchToBotCredentials();

    // 5. Push branch if not already pushed
    const isRemote = getBranchRemoteStatus(currentBranch);
    if (!isRemote) {
      log('\n→ Pushing branch to remote...', 'cyan');
      exec(`git push -u origin ${currentBranch}`);
      log('✓ Branch pushed', 'green');
    } else {
      log('\n✓ Branch already on remote', 'green');
    }

    // 6. Create PR using gh CLI
    log('\n→ Creating pull request...', 'cyan');

    // Get token from credentials file
    const homeDir = process.env.HOME;
    const credContent = fs.readFileSync(path.join(homeDir, '.git-credentials'), 'utf8');
    const tokenMatch = credContent.match(/:([^@]+)@/);
    const ghToken = tokenMatch ? tokenMatch[1] : null;

    if (!ghToken) {
      throw new Error('Could not extract GH_TOKEN from credentials');
    }

    // Create temporary file for PR body
    const bodyFile = path.join('/tmp', `pr-body-${Date.now()}.txt`);
    fs.writeFileSync(bodyFile, prBody);

    try {
      const prUrl = execSilent(
        `GH_TOKEN=${ghToken} gh pr create --title "${prTitle}" --body-file "${bodyFile}" --assignee k5qkop-bot`
      );

      log('✓ Pull request created!', 'green');
      log(`\n${prUrl}`, 'blue');
    } finally {
      // Clean up temp file
      if (fs.existsSync(bodyFile)) {
        fs.unlinkSync(bodyFile);
      }
    }

  } catch (error) {
    log(`\n✗ Error: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    // Always switch back to user credentials
    try {
      switchToUserCredentials();
    } catch (error) {
      log(`\n✗ Failed to switch back to user credentials: ${error.message}`, 'red');
      log('Please run manually:', 'yellow');
      log('  source ~/.github-tokens && \\', 'yellow');
      log('  git config --global user.name "lexey" && \\', 'yellow');
      log('  git config --global user.email "tblz@proton.me" && \\', 'yellow');
      log('  echo "https://AlexeyTuboltsev:${USER_TOKEN}@github.com" > ~/.git-credentials', 'yellow');
      process.exit(1);
    }
  }

  log('\n✓ Done!\n', 'green');
}

main();
