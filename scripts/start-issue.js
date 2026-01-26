#!/usr/bin/env node

/**
 * Start working on a GitHub issue with automatic credential switching
 *
 * Usage:
 *   node scripts/start-issue.js <issue-number>
 *   yarn issue <issue-number>
 *
 * Example:
 *   yarn issue 17
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
  magenta: '\x1b[35m',
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

function hasUncommittedChanges() {
  const status = execSilent('git status --porcelain');
  return status.length > 0;
}

function getGhToken() {
  const homeDir = process.env.HOME;
  const credContent = fs.readFileSync(path.join(homeDir, '.git-credentials'), 'utf8');
  const tokenMatch = credContent.match(/\/\/[^:]+:([^@]+)@/);
  return tokenMatch ? tokenMatch[1] : null;
}

function generateBranchName(issueNumber, issueTitle) {
  // Convert title to branch name format: lowercase, replace spaces/special chars with hyphens
  const slugTitle = issueTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 40) // Limit length
    .replace(/-+$/, ''); // Remove trailing hyphens

  return `${issueNumber}-${slugTitle}`;
}

function parseIssueOutput(issueOutput) {
  const lines = issueOutput.split('\n');
  const issue = {};

  for (const line of lines) {
    if (line.includes('title:')) {
      issue.title = line.replace('title:', '').trim();
    } else if (line.includes('state:')) {
      issue.state = line.replace('state:', '').trim();
    } else if (line.includes('assignees:')) {
      issue.assignees = line.replace('assignees:', '').trim();
    } else if (line.includes('labels:')) {
      issue.labels = line.replace('labels:', '').trim();
    } else if (line === '--') {
      // Body starts after --
      const bodyStartIndex = lines.indexOf(line) + 1;
      issue.body = lines.slice(bodyStartIndex).join('\n').trim();
      break;
    }
  }

  return issue;
}

async function main() {
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║      Start Working on GitHub Issue     ║', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');

  try {
    // Parse arguments
    const args = process.argv.slice(2);
    if (args.length === 0) {
      log('\n✗ Error: Issue number required', 'red');
      log('\nUsage: yarn issue <issue-number>', 'yellow');
      log('Example: yarn issue 17', 'yellow');
      process.exit(1);
    }

    const issueNumber = args[0];

    // 1. Check current state
    log('\n→ Checking current state...', 'cyan');

    const currentBranch = getCurrentBranch();
    log(`  Current branch: ${currentBranch}`, 'yellow');

    if (currentBranch !== 'main') {
      log('\n⚠ Warning: Not on main branch', 'yellow');
      const response = execSilent('read -p "Switch to main? (y/n): " answer && echo $answer', {
        shell: '/bin/bash',
        ignoreError: true
      });

      if (response !== 'y') {
        log('\n✗ Aborted', 'red');
        process.exit(1);
      }

      execSilent('git checkout main');
      log('✓ Switched to main', 'green');
    }

    if (hasUncommittedChanges()) {
      throw new Error('You have uncommitted changes. Please commit or stash them first.');
    }

    // 2. Switch to bot credentials
    switchToBotCredentials();

    // 3. Pull latest from origin
    log('\n→ Pulling latest from origin/main...', 'cyan');
    exec('git pull origin main');
    log('✓ Up to date with origin/main', 'green');

    // 4. Get issue details
    log(`\n→ Fetching issue #${issueNumber}...`, 'cyan');

    const ghToken = getGhToken();
    if (!ghToken) {
      throw new Error('Could not extract GH_TOKEN from credentials');
    }

    const issueOutput = execSilent(`GH_TOKEN=${ghToken} gh issue view ${issueNumber}`);
    const issue = parseIssueOutput(issueOutput);

    if (!issue.title) {
      throw new Error(`Issue #${issueNumber} not found`);
    }

    log('\n' + '═'.repeat(50), 'blue');
    log(`Issue #${issueNumber}: ${issue.title}`, 'magenta');
    log('═'.repeat(50), 'blue');
    log(`State: ${issue.state}`, 'yellow');
    log(`Labels: ${issue.labels || 'none'}`, 'yellow');
    log(`Assignees: ${issue.assignees || 'none'}`, 'yellow');
    log('\nDescription:', 'cyan');
    log(issue.body || 'No description', 'reset');
    log('═'.repeat(50) + '\n', 'blue');

    // 5. Assign issue to bot
    log(`→ Assigning issue #${issueNumber} to k5qkop-bot...`, 'cyan');
    execSilent(`GH_TOKEN=${ghToken} gh issue edit ${issueNumber} --add-assignee k5qkop-bot`);
    log('✓ Issue assigned', 'green');

    // 6. Create branch
    const branchName = generateBranchName(issueNumber, issue.title);
    log(`\n→ Creating branch: ${branchName}...`, 'cyan');
    execSilent(`git checkout -b ${branchName}`);
    log('✓ Branch created and checked out', 'green');

    // 7. Switch back to user credentials
    switchToUserCredentials();

    log('\n✓ Ready to work on issue!', 'green');
    log(`\nBranch: ${branchName}`, 'cyan');
    log(`Issue: #${issueNumber} - ${issue.title}`, 'cyan');
    log('\nNext steps:', 'yellow');
    log('  1. Make your changes', 'yellow');
    log('  2. Commit your work', 'yellow');
    log(`  3. Run: yarn pr`, 'yellow');

  } catch (error) {
    log(`\n✗ Error: ${error.message}`, 'red');

    // Try to switch back to user credentials
    try {
      const currentBranch = getCurrentBranch();
      if (currentBranch !== 'main') {
        log('\n→ Cleaning up: switching back to main...', 'yellow');
        execSilent('git checkout main', { ignoreError: true });
      }
      switchToUserCredentials();
    } catch (cleanupError) {
      log(`\n✗ Failed to cleanup: ${cleanupError.message}`, 'red');
      log('Please run manually:', 'yellow');
      log('  git checkout main', 'yellow');
      log('  source ~/.github-tokens && \\', 'yellow');
      log('  git config --global user.name "lexey" && \\', 'yellow');
      log('  git config --global user.email "tblz@proton.me" && \\', 'yellow');
      log('  echo "https://AlexeyTuboltsev:${USER_TOKEN}@github.com" > ~/.git-credentials', 'yellow');
    }
    process.exit(1);
  }

  log('\n');
}

main();
