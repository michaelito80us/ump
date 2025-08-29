#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ADR_DIR = path.join(__dirname, '..', 'docs', 'adr');

// Ensure ADR directory exists
if (!fs.existsSync(ADR_DIR)) {
  fs.mkdirSync(ADR_DIR, { recursive: true });
}

function getNextAdrNumber() {
  const files = fs
    .readdirSync(ADR_DIR)
    .filter((file) => file.match(/^\d{4}-.*\.md$/));

  if (files.length === 0) {
    return '0001';
  }

  const numbers = files.map((file) => parseInt(file.substring(0, 4)));
  const maxNumber = Math.max(...numbers);
  return String(maxNumber + 1).padStart(4, '0');
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function createNewAdr(title) {
  const number = getNextAdrNumber();
  const slug = slugify(title);
  const filename = `${number}-${slug}.md`;
  const filepath = path.join(ADR_DIR, filename);

  const template = `# ${number.replace(/^0+/, '')}. ${title}

**Date:** ${new Date().toISOString().split('T')[0]}

**Status:** Proposed

**Deciders:** [List decision makers]

## Context

[Describe the context and problem statement]

## Decision

[Describe the decision that was made]

## Consequences

### Positive

- [Positive consequence 1]
- [Positive consequence 2]

### Negative

- [Negative consequence 1]
- [Negative consequence 2]

### Neutral

- [Neutral consequence 1]
- [Neutral consequence 2]

## Implementation

[Describe implementation details, if applicable]

## Related Decisions

[List related ADRs]

## References

[List relevant references and links]
`;

  fs.writeFileSync(filepath, template);
  console.log(`Created ADR: ${filename}`);
  return filepath;
}

function listAdrs() {
  const files = fs
    .readdirSync(ADR_DIR)
    .filter((file) => file.match(/^\d{4}-.*\.md$/))
    .sort();

  if (files.length === 0) {
    console.log('No ADRs found.');
    return;
  }

  console.log('Architecture Decision Records:');
  console.log('==============================');

  files.forEach((file) => {
    const filepath = path.join(ADR_DIR, file);
    const content = fs.readFileSync(filepath, 'utf8');
    const titleMatch = content.match(/^# (\d+)\. (.+)$/m);
    const statusMatch = content.match(/\*\*Status:\*\* (.+)$/m);

    if (titleMatch) {
      const number = titleMatch[1];
      const title = titleMatch[2];
      const status = statusMatch ? statusMatch[1] : 'Unknown';
      console.log(`${number.padStart(4, '0')}: ${title} (${status})`);
    } else {
      console.log(`${file}: [Could not parse title]`);
    }
  });
}

function generateToc() {
  const files = fs
    .readdirSync(ADR_DIR)
    .filter((file) => file.match(/^\d{4}-.*\.md$/))
    .sort();

  let toc = `# Architecture Decision Records\n\n`;
  toc += `This directory contains Architecture Decision Records (ADRs) for the UMP project.\n\n`;
  toc += `## Index\n\n`;

  if (files.length === 0) {
    toc += `No ADRs have been created yet.\n`;
  } else {
    files.forEach((file) => {
      const filepath = path.join(ADR_DIR, file);
      const content = fs.readFileSync(filepath, 'utf8');
      const titleMatch = content.match(/^# (\d+)\. (.+)$/m);
      const statusMatch = content.match(/\*\*Status:\*\* (.+)$/m);

      if (titleMatch) {
        const number = titleMatch[1];
        const title = titleMatch[2];
        const status = statusMatch ? statusMatch[1] : 'Unknown';
        toc += `- [ADR-${number.padStart(4, '0')}: ${title}](${file}) - ${status}\n`;
      }
    });
  }

  toc += `\n## Creating New ADRs\n\n`;
  toc += `To create a new ADR, run:\n\n`;
  toc += `\`\`\`bash\n`;
  toc += `pnpm adr:new "Your Decision Title"\n`;
  toc += `\`\`\`\n\n`;
  toc += `For more information, see the [ADR Guide](README.md).\n`;

  return toc;
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'new':
      if (args.length < 2) {
        console.error('Usage: node adr-tools.js new "Title of the decision"');
        process.exit(1);
      }
      createNewAdr(args.slice(1).join(' '));
      break;

    case 'list':
      listAdrs();
      break;

    case 'generate':
      if (args[1] === 'toc') {
        console.log(generateToc());
      } else {
        console.error('Usage: node adr-tools.js generate toc');
        process.exit(1);
      }
      break;

    default:
      console.log('Usage:');
      console.log('  node adr-tools.js new "Title"     - Create a new ADR');
      console.log('  node adr-tools.js list            - List all ADRs');
      console.log(
        '  node adr-tools.js generate toc    - Generate table of contents'
      );
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  createNewAdr,
  listAdrs,
  generateToc,
  getNextAdrNumber,
};
