import { readFileSync } from 'node:fs';
import process, { argv } from 'node:process';
import { pathToFileURL } from 'node:url';
import { log, error } from 'node:console';
import { cruise } from 'dependency-cruiser';
import extractTSConfig from 'dependency-cruiser/config-utl/extract-ts-config';
import ts from 'typescript';
import configuration from './import-boundaries.mjs';

function devFlag(node) {
  return (
    ts.isPropertyAccessExpression(node) &&
    node.name.text === 'DEV' &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'env' &&
    ts.isMetaProperty(node.expression.expression) &&
    node.expression.expression.keywordToken === ts.SyntaxKind.ImportKeyword
  );
}
function requiresDev(node) {
  return (
    devFlag(node) ||
    (ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
      (requiresDev(node.left) || requiresDev(node.right))) ||
    (ts.isParenthesizedExpression(node) && requiresDev(node.expression))
  );
}
function guarded(node) {
  for (let child = node, parent = node.parent; parent; child = parent, parent = parent.parent) {
    if (
      ts.isIfStatement(parent) &&
      child === parent.thenStatement &&
      requiresDev(parent.expression)
    )
      return true;
    if (
      ts.isConditionalExpression(parent) &&
      child === parent.whenTrue &&
      requiresDev(parent.condition)
    )
      return true;
    if (
      ts.isBinaryExpression(parent) &&
      parent.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken &&
      child === parent.right &&
      requiresDev(parent.left)
    )
      return true;
  }
  return false;
}

function dynamicViolations(module) {
  const file = ts.createSourceFile(
    module.source,
    readFileSync(module.source, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const dev = new Set(
    module.dependencies
      .filter((dep) => dep.resolved.startsWith('game/dev/'))
      .map((dep) => dep.module),
  );
  const violations = [];
  const report = (node, text) => {
    const { line, character } = file.getLineAndCharacterOfPosition(node.getStart(file));
    violations.push(`${module.source}:${line + 1}:${character + 1}: ${text}`);
  };
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const dynamic = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const require = ts.isIdentifier(node.expression) && node.expression.text === 'require';
      if (dynamic || require) {
        const source = node.arguments[0];
        if (!source || !ts.isStringLiteralLike(source))
          report(
            node,
            'Importpfad muss statisch lesbar sein; verwende einen String oder ein Template ohne Ausdrücke.',
          );
        else if (dynamic && dev.has(source.text) && !guarded(node))
          report(
            node,
            `${source.text}: DEV-Import benötigt einen positiven import.meta.env.DEV-Zweig.`,
          );
      }
      if (
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isMetaProperty(node.expression.expression) &&
        ['glob', 'globEager'].includes(node.expression.name.text)
      ) {
        const source = node.arguments[0];
        const audio =
          module.source === 'game/play/assets/object-audio.ts' &&
          source &&
          ts.isStringLiteralLike(source) &&
          source.text === '../../../assets/audio/*.wav';
        if (!audio)
          report(
            node,
            'Glob-Imports sind nicht freigegeben; verwende explizite, prüfbare Modulimporte.',
          );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return violations;
}

export async function checkImportBoundaries() {
  const { output } = await cruise(
    ['game'],
    {
      ...configuration.options,
      validate: true,
      ruleSet: configuration,
    },
    {},
    { tsConfig: extractTSConfig('tsconfig.json') },
  );
  const violations = output.summary.violations.map(({ from, to, rule }) => {
    const description = configuration.forbidden.find((entry) => entry.name === rule.name)?.comment;
    return `${from} → ${to}: ${description} [${rule.name}]`;
  });
  const modules = output.modules.filter((module) => /^game\/.+\.[cm]?[jt]sx?$/.test(module.source));
  if (!modules.length) throw new Error('Keine Anwendungsquellen für die Importprüfung gefunden.');
  return {
    violations: [...violations, ...modules.flatMap(dynamicViolations)],
    modules: modules.length,
  };
}

if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  const result = await checkImportBoundaries();
  if (result.violations.length) {
    for (const violation of result.violations) error(violation);
    process.exitCode = 1;
  } else log(`Importgrenzen: ${result.modules} Anwendungsdateien geprüft.`);
}
