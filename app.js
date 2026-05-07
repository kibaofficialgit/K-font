// ===== MENU =====
function toggleMenu() {
  const d = document.getElementById("dropdown");
  d.style.display = d.style.display === "block" ? "none" : "block";
}

function openGuide() {
  document.getElementById("guideModal").style.display = "block";
}

function closeGuide() {
  document.getElementById("guideModal").style.display = "none";
}

// ===== THEME =====
function toggleTheme() {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
}

window.onload = () => {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
};

// ===== CANVAS =====
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = 220;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let drawing = false;
let points = [];
let glyphs = {};
let fontBuffer = null;

// position
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// pointer events (ALL DEVICES)
canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);

  drawing = true;
  points = [];

  const pos = getPos(e);
  points.push(pos);

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
});

canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;

  const pos = getPos(e);
  points.push(pos);

  ctx.lineWidth = document.getElementById("brushSize").value;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";

  const prev = points[points.length - 2];
  if (prev) {
    const midX = (prev.x + pos.x) / 2;
    const midY = (prev.y + pos.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
  }

  ctx.stroke();
});

function stopDrawing() {
  drawing = false;
  ctx.beginPath();
}

canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointerleave", stopDrawing);

// ===== CLEAR =====
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ===== SAVE =====
function saveGlyph() {
  const char = document.getElementById("charInput").value;
  if (!char) return alert("Enter letter");

  glyphs[char] = [...points];
  alert("Saved " + char);
}

// ===== FONT =====
function createPath(points) {
  const path = new opentype.Path();
  if (!points.length) return path;

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  points.forEach(p => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });

  const scale = 800 / Math.max(maxX - minX, maxY - minY);

  const normalized = points.map(p => ({
    x: (p.x - minX) * scale,
    y: (p.y - minY) * scale
  }));

  path.moveTo(normalized[0].x, 800 - normalized[0].y);
  normalized.forEach(p => path.lineTo(p.x, 800 - p.y));

  return path;
}

function generateFont() {
  if (Object.keys(glyphs).length === 0) {
    return alert("No letters saved!");
  }

  const glyphArray = [];

  Object.keys(glyphs).forEach(char => {
    glyphArray.push(new opentype.Glyph({
      name: char,
      unicode: char.charCodeAt(0),
      advanceWidth: 600,
      path: createPath(glyphs[char])
    }));
  });

  const font = new opentype.Font({
    familyName: "CustomFont",
    styleName: "Regular",
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs: glyphArray
  });

  fontBuffer = font.toArrayBuffer();
  loadPreview(fontBuffer);

  alert("Font generated!");
}

function loadPreview(buffer) {
  const blob = new Blob([buffer], { type: "font/ttf" });
  const url = URL.createObjectURL(blob);

  const style = document.createElement("style");
  style.innerHTML = `
    @font-face {
      font-family: "CustomFont";
      src: url(${url});
    }
  `;

  document.head.appendChild(style);
  document.getElementById("preview").style.fontFamily = "CustomFont";
}

// ===== DOWNLOAD =====
function downloadFont() {
  if (!fontBuffer) return alert("Generate first");

  const blob = new Blob([fontBuffer], { type: "font/ttf" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "CustomFont.ttf";
  link.click();
}

// ===== PREVIEW =====
document.getElementById("textInput").addEventListener("input", e => {
  document.getElementById("preview").textContent = e.target.value;
});
