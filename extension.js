const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const postcss = require("postcss");
let postcssScss = null;

try {
  postcssScss = require("postcss-scss");
} catch (error) {
  postcssScss = null;
}

function normalizeSlash(value) {
  return String(value || "").replace(/\\/g, "/");
}

function stripQuotes(value) {
  return String(value || "")
    .trim()
    .replace(/^[`'\"]|[`'\"]$/g, "");
}

function normalizeInputPath(value) {
  return normalizeSlash(stripQuotes(value));
}

function toPascalCase(value) {
  return String(value || "")
    .replace(/\.[^/.]+$/, "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function isAbsolutePath(filePath) {
  return path.isAbsolute(filePath) || /^[a-zA-Z]:\//.test(filePath);
}

function getWorkspaceCandidateRoots(editor) {
  const roots = [];
  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  const currentFilePath = editor ? getCurrentFilePath(editor) : "";

  for (const folder of workspaceFolders) {
    let root = normalizeSlash(folder.uri.fsPath);

    for (let index = 0; index < 4 && root && root !== "."; index += 1) {
      if (!roots.includes(root)) roots.push(root);
      const parent = path.posix.dirname(root);
      if (parent === root) break;
      root = parent;
    }
  }

  if (currentFilePath) {
    let dir = path.posix.dirname(currentFilePath);
    for (let index = 0; index < 6 && dir && dir !== "."; index += 1) {
      if (!roots.includes(dir)) roots.push(dir);
      const parent = path.posix.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  return roots;
}

function getCommonPrefixLength(firstPath, secondPath) {
  const firstParts = normalizeSlash(firstPath).split("/");
  const secondParts = normalizeSlash(secondPath).split("/");
  let count = 0;

  while (firstParts[count] && firstParts[count] === secondParts[count]) {
    count += 1;
  }

  return count;
}

function toAbsolutePath(filePath, editor) {
  const normalizedPath = normalizeInputPath(filePath);

  if (!normalizedPath || isAbsolutePath(normalizedPath)) {
    return normalizedPath;
  }

  const roots = getWorkspaceCandidateRoots(editor);
  const candidates = roots.map((root) => normalizeSlash(path.join(root, normalizedPath)));

  const existingCandidate = candidates.find((candidate) => fs.existsSync(candidate));
  if (existingCandidate) return existingCandidate;

  const currentFilePath = editor ? getCurrentFilePath(editor) : "";
  if (currentFilePath && candidates.length) {
    return candidates.sort(
      (a, b) => getCommonPrefixLength(b, currentFilePath) - getCommonPrefixLength(a, currentFilePath),
    )[0];
  }

  return normalizedPath;
}

function removeExtension(filePath) {
  const ext = path.posix.extname(normalizeSlash(filePath));
  if (!ext) return filePath;
  return filePath.slice(0, -ext.length);
}

function shouldOmitExtension(extWithDot) {
  return [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"].includes(String(extWithDot || "").toLowerCase());
}

function ensureRelativePrefix(filePath) {
  if (!filePath) return filePath;
  if (filePath.startsWith(".") || filePath.startsWith("/")) return filePath;
  return `./${filePath}`;
}

function getCurrentFilePath(editor) {
  return normalizeSlash(editor.document.uri.fsPath);
}

function getRelativePath(targetPath, currentFilePath) {
  const currentDir = path.posix.dirname(normalizeSlash(currentFilePath));
  const relativePath = path.posix.relative(currentDir, normalizeSlash(targetPath));
  return ensureRelativePrefix(relativePath);
}

function buildVariables(rawText, editor) {
  const currentFilePath = getCurrentFilePath(editor);
  const normalizedPath = normalizeInputPath(rawText);
  const absolutePath = toAbsolutePath(normalizedPath, editor);
  const fileName = path.posix.basename(absolutePath);
  const extWithDot = path.posix.extname(absolutePath);
  const ext = extWithDot.replace(/^\./, "");
  const name = path.posix.basename(absolutePath, extWithDot);
  const dir = path.posix.dirname(absolutePath);
  const currentDir = path.posix.dirname(currentFilePath);
  const relativePath = getRelativePath(absolutePath, currentFilePath);

  return {
    text: rawText,
    path: normalizedPath,
    absolutePath,
    dir,
    currentPath: currentFilePath,
    currentDir,
    fileName,
    name,
    ext,
    extWithDot,
    relativePath,
    relativePathNoExt: removeExtension(relativePath),
    relativePathAuto: shouldOmitExtension(extWithDot) ? removeExtension(relativePath) : relativePath,
    absolutePathNoExt: removeExtension(absolutePath),
    pathNoExt: removeExtension(normalizedPath),
    pascalName: toPascalCase(name),
  };
}

function applyVariables(template, variables) {
  return String(template || "").replace(/\{\{\s*([\w]+)\s*\}\}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : match;
  });
}

function createRegex(find, flags = "") {
  try {
    return new RegExp(find, flags);
  } catch (error) {
    throw new Error(`정규식 오류: /${find}/${flags}\n${error.message}`);
  }
}

function getRules() {
  const config = vscode.workspace.getConfiguration("smartTransformer");
  const rules = config.get("rules") || {};

  return Object.entries(rules)
    .filter(([, rule]) => rule && typeof rule.find === "string" && typeof rule.replace === "string")
    .map(([name, rule]) => ({
      name,
      find: rule.find,
      replace: rule.replace,
      flags: rule.flags || "",
      mode: rule.mode || "replace",
      when: rule.when || "always",
    }));
}

function getCssPropertyOrder() {
  const config = vscode.workspace.getConfiguration("smartTransformer");
  return config.get("cssPropertyOrder") || [];
}

async function insertText(editor, text) {
  await editor.edit((builder) => {
    builder.replace(editor.selection, text);
  });
}

function getConfig() {
  const config = vscode.workspace.getConfiguration("smartTransformer");

  return {
    showOnlyMatchedRules: config.get("showOnlyMatchedRules", true),
    fallbackToPlainPaste: config.get("fallbackToPlainPaste", true),
  };
}

function getDocumentOffset(editor, position) {
  return editor.document.offsetAt(position);
}

function isInStyleTag(editor) {
  const languageId = editor.document.languageId;

  if (!["html", "astro", "vue", "svelte"].includes(languageId)) {
    return false;
  }

  const text = editor.document.getText();
  const offset = getDocumentOffset(editor, editor.selection.active);
  const before = text.slice(0, offset);
  const after = text.slice(offset);

  const lowerBefore = before.toLowerCase();
  const lowerAfter = after.toLowerCase();
  const lastStyleOpen = lowerBefore.lastIndexOf("<style");
  const lastStyleClose = lowerBefore.lastIndexOf("</style>");
  const nextStyleClose = lowerAfter.indexOf("</style>");

  return lastStyleOpen > lastStyleClose && nextStyleClose !== -1;
}

function isCssLikeContext(editor) {
  const languageId = editor.document.languageId;
  if (["css", "scss", "sass", "less"].includes(languageId)) {
    return true;
  }
  return isInStyleTag(editor);
}

function getCurrentFileName(editor) {
  return path.posix.basename(normalizeSlash(editor.document.uri.fsPath));
}

function getCurrentExt(editor) {
  return path.posix.extname(normalizeSlash(editor.document.uri.fsPath)).replace(".", "");
}

function isRuleAllowedInContext(rule, editor) {
  const conditions = Array.isArray(rule.when) ? rule.when : [rule.when || "always"];
  const normalizedConditions = conditions.map((condition) => String(condition).toLowerCase());
  const languageId = editor.document.languageId.toLowerCase();
  const fileName = getCurrentFileName(editor).toLowerCase();
  const ext = getCurrentExt(editor).toLowerCase();

  if (normalizedConditions.includes("always")) return true;
  if (normalizedConditions.includes("css") && isCssLikeContext(editor)) {
    return true;
  }
  if (
    normalizedConditions.includes(languageId) ||
    normalizedConditions.includes(ext) ||
    normalizedConditions.includes(fileName)
  ) {
    return true;
  }
  return false;
}

function getValidRules(sourceText, rules, showOnlyMatchedRules, editor) {
  const validRules = [];

  for (const rule of rules) {
    if (!isRuleAllowedInContext(rule, editor)) {
      continue;
    }

    try {
      const regex = createRegex(rule.find, rule.flags);
      const isMatched = regex.test(sourceText);

      if (!showOnlyMatchedRules || isMatched) {
        validRules.push({ ...rule, isMatched });
      }
    } catch (error) {
      validRules.push({ ...rule, error: error.message });
    }
  }

  return validRules;
}

async function pickRule(validRules, placeHolder) {
  return vscode.window.showQuickPick(
    validRules.map((rule) => ({
      label: rule.name,
      rule,
    })),
    {
      placeHolder,
      matchOnDescription: false,
      matchOnDetail: false,
    },
  );
}

function getCssPropertyName(line) {
  const match = line.match(/^\s*((?:--)?-?[_a-zA-Z][\w-]*)\s*:/);
  return match ? match[1] : "";
}

function normalizeCssPropertyName(propertyName) {
  return String(propertyName || "")
    .toLowerCase()
    .replace(/^-(webkit|moz|ms|o)-/, "");
}

function getCssPropertyRank(propertyName, order) {
  const normalizedProperty = normalizeCssPropertyName(propertyName);
  const normalizedOrder = order.map(normalizeCssPropertyName);
  const exactIndex = normalizedOrder.indexOf(normalizedProperty);

  if (exactIndex !== -1) return exactIndex;

  const shorthandIndex = normalizedOrder.findIndex((item) => normalizedProperty.startsWith(`${item}-`));
  if (shorthandIndex !== -1) return shorthandIndex + 0.1;

  return Number.MAX_SAFE_INTEGER;
}

function sortDeclarationsInContainer(container, order) {
  if (!container || !Array.isArray(container.nodes)) return;

  const declarationSlots = [];

  container.nodes.forEach((node, index) => {
    if (node.type === "decl") {
      declarationSlots.push({
        index,
        node,
        originalIndex: index,
        rank: getCssPropertyRank(node.prop, order),
      });
      return;
    }

    if (node.nodes) {
      sortDeclarationsInContainer(node, order);
    }
  });

  if (declarationSlots.length < 2) return;

  const sortedDeclarations = [...declarationSlots]
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.originalIndex - b.originalIndex;
    })
    .map((item) => item.node);

  declarationSlots.forEach((slot, index) => {
    container.nodes[slot.index] = sortedDeclarations[index];
  });
}
function sortCssDeclarations(sourceText, order) {
  if (!Array.isArray(order) || !order.length) {
    vscode.window.showInformationMessage("CSS property order가 설정되어 있지 않아요.");
    return sourceText;
  }

  const text = String(sourceText || "");
  const hasBalancedBlock = (text.match(/{/g) || []).length === (text.match(/}/g) || []).length && /[{}]/.test(text);

  const parseText = hasBalancedBlock ? text : `.__smart_transform__ {\n${text}\n}`;

  try {
    const root = postcssScss
      ? postcssScss.parse(parseText, { from: undefined })
      : postcss.parse(parseText, { from: undefined });
    sortDeclarationsInContainer(root, order);

    if (!hasBalancedBlock) {
      const wrapper = root.nodes.find((node) => node.type === "rule" && node.selector === ".__smart_transform__");

      if (wrapper) {
        return wrapper.nodes
          .map((node) => {
            const text = node.toString();
            if (node.type === "decl" && !text.trim().endsWith(";")) {
              return `${text};`;
            }
            return text;
          })
          .join("\n");
      }
      return sourceText;
    }

    return root.toString();
  } catch (error) {
    vscode.window.showErrorMessage(`CSS 정렬 중 오류가 발생했어요: ${error.message}`);
    return sourceText;
  }
}

function applyRule(sourceText, editor, rule) {
  const variables = buildVariables(sourceText, editor);
  const regex = createRegex(rule.find, rule.flags);
  const replaceTemplate = applyVariables(rule.replace, variables);

  if (rule.mode === "template") return replaceTemplate;
  if (rule.mode === "cssSort") return sortCssDeclarations(sourceText, getCssPropertyOrder());

  return sourceText.replace(regex, replaceTemplate);
}

async function runTransform({ sourceText, editor, placeHolder, fallbackText = "" }) {
  const { showOnlyMatchedRules, fallbackToPlainPaste } = getConfig();
  const rules = getRules();

  if (!rules.length) {
    if (fallbackToPlainPaste && fallbackText) await insertText(editor, fallbackText);
    return;
  }

  const validRules = getValidRules(sourceText, rules, showOnlyMatchedRules, editor);

  if (!validRules.length) {
    vscode.window.showInformationMessage("적용 가능한 Smart Transformer 규칙이 없어요.");
    if (fallbackToPlainPaste && fallbackText) await insertText(editor, fallbackText);
    return;
  }

  const picked = await pickRule(validRules, placeHolder);

  if (!picked) {
    if (fallbackToPlainPaste && fallbackText) await insertText(editor, fallbackText);
    return;
  }

  if (picked.rule.error) {
    vscode.window.showErrorMessage(picked.rule.error);
    return;
  }

  const result = applyRule(sourceText, editor, picked.rule);
  await insertText(editor, result);
}

async function smartPaste() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage("활성화된 에디터가 없어요.");
    return;
  }

  const clipboardText = await vscode.env.clipboard.readText();
  if (!clipboardText) return;

  await runTransform({
    sourceText: clipboardText,
    editor,
    placeHolder: "붙여넣을 변환 규칙을 선택하세요",
    fallbackText: clipboardText,
  });
}

async function smartTransform() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage("활성화된 에디터가 없어요.");
    return;
  }

  if (editor.selection.isEmpty) {
    vscode.window.showInformationMessage("변환할 텍스트를 선택해 주세요.");
    return;
  }

  const selectedText = editor.document.getText(editor.selection);
  if (!selectedText) return;

  await runTransform({
    sourceText: selectedText,
    editor,
    placeHolder: "선택 영역에 적용할 변환 규칙을 선택하세요",
  });
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("smartTransformer.smartPaste", smartPaste),
    vscode.commands.registerCommand("smartTransformer.smartTransform", smartTransform),
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
