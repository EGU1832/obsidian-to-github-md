/* ===========================
   Obsidian to GitHub Markdown Converter
   =========================== */

// 유틸
function isInsideBlocks(index, blocks) {
  return blocks.some(([s, e]) => s <= index && index < e);
}
function findLatexBlocks(content) {
  const blocks = [];
  const re = /\${1,2}[\s\S]*?\${1,2}/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    blocks.push([m.index, m.index + m[0].length]);
  }
  return blocks;
}
function findCodeBlockRanges(content) {
  const ranges = [];
  const re = /```[\s\S]*?```/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    ranges.push([m.index, m.index + m[0].length]);
  }
  return ranges;
}
function addLineBreaks(content) {
  const latexBlocks = findLatexBlocks(content);
  const codeBlocks = findCodeBlockRanges(content);
  const lines = content.split('\n');
  const newLines = [];
  let currentIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLen = line.length + 1;
    const nextLine = (i + 1 < lines.length) ? lines[i + 1] : '';

    if (isInsideBlocks(currentIndex, latexBlocks) || isInsideBlocks(currentIndex, codeBlocks)) {
      newLines.push(line);
    } else {
      if (line.trim() === '' || nextLine.trim().startsWith('$$') || nextLine.trim().startsWith('$')) {
        newLines.push(line + '\n<br>\n');
      } else {
        newLines.push(line + '  ');
      }
    }
    currentIndex += lineLen;
  }
  return newLines.join('\n');
}
function transformLatexBlocks(content) {
  content = content.replace(/\$\$([\s\S]*?)\$\$/g, (_, inner) => `\n\`\`\`math\n${inner.trim()}\n\`\`\`\n`);
  content = content.replace(/(?<!\$)\$(?!\$)([\s\S]*?)(?<!\$)\$(?!\$)/g, (_, inner) =>
    `$\\\`${inner}\\\`$`.replace(/\\`/g, '`'));
  return content;
}
function convertImageSyntax(content) {
  return content.replace(/!\[(.*?)\]\((.*?)\)/g, (_, widthRaw, path) => {
    // widthRaw가 비어 있으면 기본 width를 쓰거나 공백 처리
    const width = widthRaw && /^\d+$/.test(widthRaw) ? widthRaw : '';

    const isUrl = /^https?:\/\//i.test(path);
    if (isUrl) {
      return width
        ? `<img src="${path}" width="${width}">\n`
        : `<img src="${path}">\n`;
    }

    try {
      const decoded = decodeURIComponent(path);
      const parts = decoded.split(/[/\\]/);
      const filename = parts[parts.length - 1];

      const newPath = `Docs/${filename}`;
      return width
        ? `<img src="${newPath}" width="${width}">\n`
        : `<img src="${newPath}">\n`;

    } catch {
      return width
        ? `<img src="${path}" width="${width}">\n`
        : `<img src="${path}">\n`;
    }
  });
}

function removeTabsOutsideCodeblocks(content) {
  const codeBlockRanges = findCodeBlockRanges(content);
  let result = '';
  for (let i = 0; i < content.length; i++) {
    const inside = isInsideBlocks(i, codeBlockRanges);
    const ch = content[i];
    result += (inside ? ch : (ch === '\t' ? '' : ch));
  }
  return result;
}
function convertObsidianToGitHubMD(content) {
  content = addLineBreaks(content);
  content = transformLatexBlocks(content);
  content = convertImageSyntax(content);
  content = removeTabsOutsideCodeblocks(content);
  return content;
}

/* ===========================
   미리보기 렌더링
   =========================== */
const elOutput = document.getElementById('output-md');
const elPreview = document.getElementById('preview');
const elConsole = document.getElementById('console-log');
const elBtnClear = document.getElementById('btn-clear');
const elBtnToggle = document.getElementById('btn-toggle');
const btnCompile = document.getElementById('btn-compile');
const elLangButton = document.getElementById('btn-lang');
const docRoot = document.documentElement;
const WORKER_URL = "https://markdown-proxy.skygrid1832.workers.dev/render_markdown";

function logConsole(msg, type = 'info', extra = null) {
  const time = new Date().toLocaleTimeString();
  const tag =
    type === 'error' ? '[ERROR]' :
    type === 'warn' ? '[WARN ]' : '[INFO ]';

  elConsole.textContent += `[${time}] ${tag} ${msg}\n`;

  if (extra) {
    elConsole.textContent += JSON.stringify(extra, null, 2) + '\n';
  }
}

function setConsoleCollapsed(collapsed) {
  document.querySelector('.console .console-body').style.display = collapsed ? 'none' : 'block';
}

let consoleCollapsed = false;
elBtnToggle.addEventListener('click', () => {
  consoleCollapsed = !consoleCollapsed;
  setConsoleCollapsed(consoleCollapsed);
});
elBtnClear.addEventListener('click', () => { elConsole.textContent = ''; });

async function previewRender() {
  const text = elOutput.value;

  try {
    logConsole(i18n[currentLang].renderRequestStart);

    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const raw = await res.text();

    if (!res.ok) {
      logConsole(i18n[currentLang].serverResponseError, "error", {
        status: res.status,
        body: raw
      });
      throw new Error(`HTTP ${res.status}`);
    }

    let html = raw;
    html = html
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'");

    elPreview.innerHTML = html;

    if (window.MathJax?.typesetPromise) {
      await MathJax.typesetPromise([elPreview]);
    }

    logConsole(i18n[currentLang].renderSuccess);

  } catch (err) {
    logConsole(err.message, "error", err.stack);
    elPreview.innerHTML =
      `<pre style="color:#f85149">${i18n[currentLang].renderError}:\n${err.message}</pre>`;
  }
}

/* ===========================
   파일 / 샘플 / 저장
   =========================== */
const elFile = document.getElementById('file-input');
const elBtnDownload = document.getElementById('btn-download');
const elBtnSample = document.getElementById('btn-sample');
let lastFileName = "converted_github.md";

const dropZone = document.body;

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
});

dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();

  const file = e.dataTransfer.files?.[0];
  if (!file) return;

  const text = await file.text();
  const converted = convertObsidianToGitHubMD(text);

  elOutput.value = converted;

  lastFileName = file.name;

  logConsole(`${i18n[currentLang].dragFileLoaded}: ${file.name}`);
});

elFile.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const text = await file.text();
  const converted = convertObsidianToGitHubMD(text);

  elOutput.value = converted;
  lastFileName = file.name.replace(/\.md$/, '_converted.md');

  logConsole(`${i18n[currentLang].fileLoadedConverted}: ${file.name}`);
});

elBtnDownload.addEventListener('click', () => {
  const filename = prompt(i18n[currentLang].promptFilename, lastFileName) || lastFileName;

  const blob = new Blob([elOutput.value], {
    type: 'text/markdown;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.download = filename;
  a.href = url;
  a.click();

  URL.revokeObjectURL(url);

  logConsole(`${i18n[currentLang].fileSaved}: ${filename}`);
});

elBtnSample.addEventListener('click', () => {
  const sample = [
    i18n[currentLang].sampleTitle,
    '',
    '$$',
    '\\int_0^1 x^2 \\, dx = \\frac{1}{3}',
    '$$',
    '',
    '```python',
    'print("Hello World")',
    '```',
    ''
  ].join('\n');
  elOutput.value = convertObsidianToGitHubMD(sample);
  logConsole(i18n[currentLang].sampleLoaded);
});

/* ===========================
   "다시 컴파일하기" 버튼
   =========================== */
function setCompileLoading(loading) {
  if (loading) {
    btnCompile.disabled = true;
    btnCompile.innerHTML = `<span class="material-symbols-rounded spin">refresh</span><span class="label">${i18n[currentLang].loading}</span>`;
  } else {
    btnCompile.disabled = false;
    btnCompile.innerHTML = `<span class="material-symbols-rounded">refresh</span><span class="label">${i18n[currentLang].compile}</span>`;
  }

  btnCompile.title = i18n[currentLang].compile;
}

btnCompile.addEventListener('click', async () => {
  setCompileLoading(true);
  logConsole(i18n[currentLang].recompiling);
  await previewRender();
  setCompileLoading(false);
  logConsole(i18n[currentLang].done);
});

/* ===========================
    드래그로 분할선 조정 기능 (수평/수직 모두 대응)
   =========================== */
const container = document.querySelector('.editor-container');
const splitter = document.getElementById('splitter');
const leftPane = document.querySelector('.pane-left');

let isDragging = false;

function beginDrag(e) {
  e.preventDefault();
  isDragging = true;
  container.classList.add('dragging');
  document.body.style.cursor = getComputedStyle(container).flexDirection === 'column' ? 'row-resize' : 'col-resize';
  document.body.style.userSelect = 'none';
}

function endDrag() {
  if (!isDragging) return;
  isDragging = false;
  container.classList.remove('dragging');
  document.body.style.cursor = 'default';
  document.body.style.userSelect = '';
}

function onDrag(e) {
  if (!isDragging) return;

  const rect = container.getBoundingClientRect();
  const isColumn = getComputedStyle(container).flexDirection === 'column';
  const min = 200; // 최소 px
  const maxX = rect.width * 0.9;
  const maxY = rect.height * 0.9;

  if (!isColumn) {
    // 좌우 레이아웃
    const offsetX = e.clientX - rect.left;
    const newW = Math.min(Math.max(offsetX, min), maxX);
    // 핵심: flex-basis를 직접 변경
    leftPane.style.flex = `0 0 ${newW}px`;
    leftPane.style.width = `${newW}px`; // (보조)
  } else {
    // 상하 레이아웃(모바일)
    const offsetY = e.clientY - rect.top;
    const newH = Math.min(Math.max(offsetY, 150), maxY);
    leftPane.style.flex = `0 0 ${newH}px`;
    leftPane.style.height = `${newH}px`;
  }
}

/* ===========================
    한/영 전환
   =========================== */
let currentLang = 'ko';

const i18n = {
  ko: {
    appTitle: "Obsidian to GitHub Markdown Converter",
    compile: "다시 컴파일하기",
    loading: "컴파일 중...",
    preview: "여기에 미리보기가 표시됩니다.",
    done: "렌더링 완료.",
    langToggle: "언어 전환",
    loadFile: ".md 파일 불러오기",
    downloadFile: "변환본 저장 (.md)",
    loadSample: "샘플 불러오기",
    openGithub: "GitHub 열기",
    editorHeading: "GitHub 변환본 (편집 가능)",
    outputPlaceholder: "여기에 변환된 Markdown이 표시됩니다.",
    previewHeading: "GitHub 페이지 뷰",
    consoleHeading: "오류/경고 콘솔",
    clear: "지우기",
    toggle: "접기/펼치기",
    consoleInitial: "(수식 오류가 있으면 라인 번호와 함께 표시됩니다)\n",
    dropOverlay: "파일을 여기에 드롭하세요 (.md)",
    promptFilename: "파일 이름을 입력하세요:",
    renderRequestStart: "렌더링 요청 시작",
    serverResponseError: "서버 응답 오류",
    renderSuccess: "렌더링 성공",
    renderError: "렌더링 오류",
    dragFileLoaded: "드래그 파일 로드",
    fileLoadedConverted: "파일 로드 및 변환 완료",
    fileSaved: "파일 저장됨",
    sampleTitle: "# 샘플 문서",
    sampleLoaded: "샘플을 로드했습니다.",
    recompiling: "다시 컴파일 중...",
    ready: '준비 완료. .md 파일을 불러오거나 "다시 컴파일하기"를 눌러 렌더링하세요.'
  },
  en: {
    appTitle: "Obsidian to GitHub Markdown Converter",
    compile: "Recompile",
    loading: "Compiling...",
    preview: "Preview will appear here.",
    done: "Rendering complete.",
    langToggle: "Switch language",
    loadFile: "Load .md file",
    downloadFile: "Save converted file (.md)",
    loadSample: "Load sample",
    openGithub: "Open GitHub",
    editorHeading: "Converted GitHub Markdown (editable)",
    outputPlaceholder: "Converted Markdown will appear here.",
    previewHeading: "GitHub Page View",
    consoleHeading: "Error/Warning Console",
    clear: "Clear",
    toggle: "Collapse/Expand",
    consoleInitial: "(Formula errors are shown with line numbers)\n",
    dropOverlay: "Drop your file here (.md)",
    promptFilename: "Enter a file name:",
    renderRequestStart: "Starting render request",
    serverResponseError: "Server response error",
    renderSuccess: "Rendering succeeded",
    renderError: "Rendering error",
    dragFileLoaded: "Dragged file loaded",
    fileLoadedConverted: "File loaded and converted",
    fileSaved: "File saved",
    sampleTitle: "# Sample Document",
    sampleLoaded: "Sample loaded.",
    recompiling: "Recompiling...",
    ready: 'Ready. Load an .md file or click "Recompile" to render.'
  }
};

function updateStaticTranslations() {
  const dict = i18n[currentLang];

  docRoot.lang = currentLang;

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (dict[key]) {
      node.textContent = dict[key];
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach((node) => {
    const key = node.dataset.i18nTitle;
    if (dict[key]) {
      node.title = dict[key];
      node.setAttribute('aria-label', dict[key]);
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    if (dict[key]) {
      node.placeholder = dict[key];
    }
  });
}

function setConsoleInitialMessage() {
  const isInitialMessage =
    elConsole.textContent === i18n.ko.consoleInitial ||
    elConsole.textContent === i18n.en.consoleInitial;

  if (isInitialMessage) {
    elConsole.textContent = i18n[currentLang].consoleInitial;
  }
}

function applyLanguage() {
  const dict = i18n[currentLang];

  updateStaticTranslations();
  setConsoleInitialMessage();

  const compileLabel = btnCompile.querySelector('.label');
  if (compileLabel) {
    compileLabel.textContent = btnCompile.disabled ? dict.loading : dict.compile;
  }
  btnCompile.title = dict.compile;
  btnCompile.setAttribute('aria-label', dict.compile);

  const previewText = elPreview.textContent.trim();
  const isPreviewPlaceholder =
    !previewText ||
    previewText === i18n.ko.preview ||
    previewText === i18n.en.preview;

  if (isPreviewPlaceholder) {
    elPreview.innerHTML = `<p>${dict.preview}</p>`;
  }

  elLangButton.setAttribute('aria-pressed', currentLang === 'en' ? 'true' : 'false');
}

document.getElementById('btn-lang').addEventListener('click', () => {
  currentLang = currentLang === 'ko' ? 'en' : 'ko';
  applyLanguage();
  logConsole(`Language switched to ${currentLang}`);
});

/* ===========================
   초기화
   =========================== */
elOutput.value = '';
elPreview.innerHTML = '';
applyLanguage();
logConsole(i18n[currentLang].ready);

const overlay = document.getElementById('drop-overlay');

if (overlay) {
  document.addEventListener('dragenter', () => {
    overlay.classList.add('active');
  });

  document.addEventListener('dragleave', () => {
    overlay.classList.remove('active');
  });

  document.addEventListener('drop', () => {
    overlay.classList.remove('active');
  });
}

// 마우스
splitter.addEventListener('mousedown', beginDrag);
window.addEventListener('mousemove', onDrag);
window.addEventListener('mouseup', endDrag);

// 터치
splitter.addEventListener('touchstart', (e) => beginDrag(e.touches[0]), { passive: false });
window.addEventListener('touchmove', (e) => { onDrag(e.touches[0]); }, { passive: false });
window.addEventListener('touchend', endDrag);


/* ===========================
   참고:
   - GitHub 본가의 마크다운과 100% 동일한 파이프라인은 아니지만,
     GFM + KaTeX + GitHub CSS를 통해 매우 유사한 결과를 제공합니다.
   - 변환 규칙은 질문에 제공된 Python 버전과 동일한 의도를 따릅니다.
   =========================== */