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
  return content.replace(/!\[(\d+)\]\((.*?)\)/g, (_, width, path) => {
    const isUrl = /^https?:\/\//i.test(path);
    if (isUrl) return `<img src="${path}" width="${width}">\n`;
    try {
      const decoded = decodeURIComponent(path);
      const filename = decoded.split('/').pop();
      return `<img src="Docs/${filename}" width="${width}">\n`;
    } catch {
      return `<img src="${path}" width="${width}">\n`;
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
const WORKER_URL = "https://markdown-proxy.skygrid1832.workers.dev/render_markdown";

function logConsole(msg, type = 'info') {
  const tag = (type === 'error') ? '[ERROR] ' : (type === 'warn') ? '[WARN ] ' : '[INFO ] ';
  elConsole.textContent += `${tag}${msg}\n`;
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
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error("GitHub API error: " + res.status);
    let html = await res.text();
    html = html
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'");
    elPreview.innerHTML = html;

    if (window.MathJax && window.MathJax.typesetPromise) {
      await MathJax.typesetPromise([elPreview]);
    }
  } catch (err) {
    elPreview.innerHTML = `<pre style="color:#f85149">렌더링 오류: ${err.message}</pre>`;
  }
}

/* ===========================
   파일 / 샘플 / 저장
   =========================== */
const elFile = document.getElementById('file-input');
const elBtnDownload = document.getElementById('btn-download');
const elBtnSample = document.getElementById('btn-sample');

elFile.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const converted = convertObsidianToGitHubMD(text);
  elOutput.value = converted;
  logConsole(`파일 로드 및 변환 완료: ${file.name}`);
});

elBtnDownload.addEventListener('click', () => {
  const blob = new Blob([elOutput.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = 'converted_github.md';
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);
  logConsole('변환본을 저장했습니다.');
});

elBtnSample.addEventListener('click', () => {
  const sample = [
    '# 샘플 문서',
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
  logConsole('샘플을 로드했습니다.');
});

/* ===========================
   "다시 컴파일하기" 버튼
   =========================== */
function setCompileLoading(loading) {
  if (loading) {
    btnCompile.disabled = true;
    btnCompile.innerHTML = '<span class="material-symbols-rounded spin">refresh</span><span class="label"> 컴파일 중...</span>';
  } else {
    btnCompile.disabled = false;
    btnCompile.innerHTML = '<span class="material-symbols-rounded">refresh</span><span class="label">다시 컴파일하기</span>';
  }
}

btnCompile.addEventListener('click', async () => {
  setCompileLoading(true);
  logConsole("다시 컴파일 중...");
  await previewRender();
  setCompileLoading(false);
  logConsole("렌더링 완료.");
});

/* ===========================
   초기화
   =========================== */
elOutput.value = '';
elPreview.innerHTML = '<p>여기에 미리보기가 표시됩니다.</p>';
logConsole('준비 완료. .md 파일을 불러오거나 "다시 컴파일하기"를 눌러 렌더링하세요.');


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