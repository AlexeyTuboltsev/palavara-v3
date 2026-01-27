#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Build-time markdown to TSX converter
 *
 * Reads all .md files from texts/ and generates corresponding .tsx components
 * in src/generated/ directory. These components contain the parsed markdown as
 * static React elements with proper styling.
 */

const FILES_DIR = path.resolve(__dirname, '../texts');
const OUTPUT_DIR = path.resolve(__dirname, '../src/generated');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Escapes special characters in text for safe inclusion in JSX
 */
function escapeText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}

/**
 * Parse markdown line and return JSX element
 */
function parseMarkdownLine(line) {
  const trimmed = line.trim();

  if (trimmed === '') {
    return null;
  }

  // Headers
  if (trimmed.startsWith('### ')) {
    return `      <h3>${escapeText(trimmed.substring(4))}</h3>`;
  }
  if (trimmed.startsWith('## ')) {
    return `      <h2>${escapeText(trimmed.substring(3))}</h2>`;
  }
  if (trimmed.startsWith('# ')) {
    return `      <h1>${escapeText(trimmed.substring(2))}</h1>`;
  }

  // Regular paragraph
  return `      <p>${escapeText(trimmed)}</p>`;
}

/**
 * Process markdown content into JSX elements
 */
function processMarkdown(content) {
  const lines = content.split('\n');
  const jsxElements = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : null;

    // If current line is empty (blank line between paragraphs), add <br />
    if (currentLine.trim() === '' && prevLine !== null && prevLine.trim() !== '') {
      jsxElements.push('      <br />');
      continue;
    }

    // Skip consecutive empty lines
    if (currentLine.trim() === '') {
      continue;
    }

    // Parse and add the line
    const element = parseMarkdownLine(currentLine);
    if (element) {
      jsxElements.push(element);
    }
  }

  return jsxElements.join('\n');
}

/**
 * Generate TSX component from markdown file
 */
function generateComponent(markdownPath, fileName) {
  const content = fs.readFileSync(markdownPath, 'utf8');
  const jsxContent = processMarkdown(content);

  // Component name: impressum.md -> Impressum
  const componentName = fileName
    .replace('.md', '')
    .replace(/^./, str => str.toUpperCase());

  const tsxContent = `import React, { FC } from 'react';
import styles from '../components/Section.module.scss';

/**
 * Auto-generated from ${fileName}
 * DO NOT EDIT - This file is generated at build time by scripts/generate-markdown-components.js
 */
export const ${componentName}Content: FC = () => {
  return (
    <div className={styles.text}>
${jsxContent}
    </div>
  );
};
`;

  const outputPath = path.join(OUTPUT_DIR, `${componentName}Content.tsx`);
  fs.writeFileSync(outputPath, tsxContent, 'utf8');

  console.log(`Generated: ${outputPath}`);
}

/**
 * Process all markdown files
 */
function processAllMarkdownFiles() {
  console.log('Generating TypeScript components from markdown files...\n');

  if (!fs.existsSync(FILES_DIR)) {
    console.log(`No markdown files directory found at ${FILES_DIR}`);
    return;
  }

  const files = fs.readdirSync(FILES_DIR);
  const markdownFiles = files.filter(f => f.endsWith('.md'));

  if (markdownFiles.length === 0) {
    console.log('No markdown files found');
    return;
  }

  markdownFiles.forEach(file => {
    const fullPath = path.join(FILES_DIR, file);
    generateComponent(fullPath, file);
  });

  console.log(`\n✓ Generated ${markdownFiles.length} component(s)`);
}

// Run the generator
processAllMarkdownFiles();
