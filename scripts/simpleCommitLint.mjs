#!/usr/bin/env node

import { readFileSync } from 'fs';

const commitMsgFile = process.argv[2];
const commitMsg = readFileSync(commitMsgFile, 'utf8').trim();

// Basic conventional commits pattern
const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .{1,50}/;

if (!conventionalPattern.test(commitMsg)) {
  console.error('❌ Commit message does not follow conventional commits format');
  console.error('');
  console.error('Format: <type>[optional scope]: <description>');
  console.error('');
  console.error('Examples:');
  console.error('  feat: add new scoring plugin system');
  console.error('  fix(mobile): resolve score submission bug');
  console.error('  docs: update setup instructions');
  console.error('');
  console.error('Types: feat, fix, docs, style, refactor, test, chore');
  process.exit(1);
}

console.log('✅ Commit message follows conventional commits format'); 