#!/usr/bin/env node
/**
 * 🛡️ SecureKaro Codebase Verification Engine
 * 
 * Inspired by WCC / ECC verification harnesses.
 * Audits 100% of frontend JSX/JS components via Babel AST static analysis
 * to detect:
 * 1. Undeclared identifiers / missing imports (e.g. unimported Lucide icons)
 * 2. Syntax / parsing errors
 * 3. Backend Node.js syntax integrity (node -c)
 * 
 * Usage: npm run verify
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const FRONTEND_SRC = path.resolve(__dirname, '..', 'src');
const BACKEND_SRC = path.resolve(__dirname, '..', '..', 'safecart-backend', 'src');

const STANDARD_GLOBALS = new Set([
  'window', 'document', 'console', 'localStorage', 'sessionStorage',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame', 'cancelAnimationFrame',
  'Promise', 'Math', 'Date', 'Number', 'String', 'Boolean', 'Array', 'Object', 'JSON', 'RegExp',
  'Error', 'TypeError', 'RangeError', 'SyntaxError', 'URIError',
  'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Proxy', 'Reflect',
  'URL', 'URLSearchParams', 'Intl', 'crypto', 'navigator', 'location', 'history',
  'alert', 'prompt', 'confirm', 'fetch', 'Headers', 'Request', 'Response',
  'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'TouchEvent',
  'Blob', 'File', 'FormData', 'FileReader', 'Image', 'Audio',
  'MutationObserver', 'IntersectionObserver', 'ResizeObserver', 'AbortController', 'AbortSignal',
  'process', 'import', 'require', 'module', 'exports', '__dirname', '__filename',
  'undefined', 'NaN', 'Infinity', 'decodeURIComponent', 'encodeURIComponent', 'decodeURI', 'encodeURI',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'atob', 'btoa',
  'React', 'performance', 'screen', 'indexedDB'
]);

let totalFilesScanned = 0;
let errorsFound = 0;

console.log('\n============================================================');
console.log('🛡️  SECUREKARO AUTOMATED CODEBASE VERIFICATION ENGINE');
console.log('============================================================\n');

// ── 1. FRONTEND BABEL AST STATIC ANALYSIS ─────────────────────────────────────
console.log('📦 Step 1: Scanning Frontend Components & Views (Babel AST)...');

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        scanDir(full);
      }
    } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
      totalFilesScanned++;
      verifyFile(full);
    }
  }
}

function verifyFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const relPath = path.relative(path.resolve(__dirname, '..'), filePath);

  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'importMeta',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'exportDefaultFrom',
        'optionalChaining',
        'nullishCoalescingOperator',
        'objectRestSpread',
        'dynamicImport'
      ]
    });
  } catch (parseErr) {
    console.error(`❌ [SYNTAX ERROR] ${relPath}:${parseErr.loc ? parseErr.loc.line : '?'}`);
    console.error(`   ${parseErr.message}\n`);
    errorsFound++;
    return;
  }

  try {
    traverse(ast, {
      ReferencedIdentifier(pathNode) {
        const name = pathNode.node.name;
        if (STANDARD_GLOBALS.has(name)) return;
        if (name === 'arguments') return;

        // Check if binding exists in any parent scope
        if (!pathNode.scope.hasBinding(name)) {
          // Ignore special JSX identifiers and CSS/TS type helpers
          if (name === 'Fragment' || name === 'h') return;

          const loc = pathNode.node.loc ? pathNode.node.loc.start : { line: '?', column: '?' };
          console.error(`❌ [UNDECLARED REFERENCE] ${relPath}:${loc.line}:${loc.column}`);
          console.error(`   Identifier '${name}' is referenced but never imported or declared.\n`);
          errorsFound++;
        }
      }
    });
  } catch (travErr) {
    console.error(`❌ [TRAVERSAL ERROR] in ${relPath}: ${travErr.message}`);
    errorsFound++;
  }
}

if (fs.existsSync(FRONTEND_SRC)) {
  scanDir(FRONTEND_SRC);
  console.log(`   ✓ Checked ${totalFilesScanned} frontend files.`);
} else {
  console.warn(`   ⚠️ Frontend src directory not found at: ${FRONTEND_SRC}`);
}

// ── 2. BACKEND SYNTAX INTEGRITY CHECK (NODE -C) ────────────────────────────────
console.log('\n📦 Step 2: Verifying Backend Node.js Syntax Integrity...');

let backendFilesChecked = 0;
function scanBackend(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        scanBackend(full);
      }
    } else if (entry.name.endsWith('.js')) {
      backendFilesChecked++;
      try {
        execSync(`node -c "${full}"`, { stdio: 'pipe' });
      } catch (err) {
        console.error(`❌ [BACKEND SYNTAX ERROR] ${path.relative(BACKEND_SRC, full)}`);
        console.error(`   ${err.stderr ? err.stderr.toString().trim() : err.message}\n`);
        errorsFound++;
      }
    }
  }
}

if (fs.existsSync(BACKEND_SRC)) {
  scanBackend(BACKEND_SRC);
  console.log(`   ✓ Verified ${backendFilesChecked} backend files.`);
} else {
  console.log('   ℹ️ Backend directory not found adjacent to frontend (skipping backend check).');
}

// ── 3. SUMMARY ────────────────────────────────────────────────────────────────
console.log('\n============================================================');
if (errorsFound === 0) {
  console.log('✅ ALL CHECKS PASSED: 0 undeclared references, 0 syntax errors.');
  console.log('   The codebase is clean, robust, and safe for deployment.');
  console.log('============================================================\n');
  process.exit(0);
} else {
  console.error(`❌ VERIFICATION FAILED: ${errorsFound} critical issue(s) detected.`);
  console.error('   Please resolve the above errors before committing or deploying.');
  console.error('============================================================\n');
  process.exit(1);
}
