const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = canvas.offsetWidth;
canvas.height = 250;

let drawing = false;
let points = [];
let glyphs = {};
let fontBuffer = null;

const brushSize = document.getElementById("brushSize");

// 🎯 Get correct position (mobile + desktop)
function getPos(e) {
  const rect = canvas.getBoundingClientRect();

  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  } else {
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
}

// 🟢 Start drawing
function startDrawing(e) {
  e.preventDefault();
  drawing = true;
  points = [];

  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  points.push(pos);
}

// ✏️ Draw with smoothing
function draw(e) {
  if (!drawing) return;
  e.preventDefault();

  const pos = getPos(e);
  points.push(pos);

  ctx.lineWidth = brushSize.value;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#222";

  const prev = points[points.length - 2];

  if (prev) {
    const midX = (prev.x + pos.x) / 2;
    const midY = (prev.y + pos.y) / 2;

    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
  } else {
    ctx.lineTo(pos.x, pos.y);
  }

  ctx.stroke();
}

// 🔴 Stop drawing
function stopDrawing() {
  drawing = false;
}

// 🧹 Clear canvas
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
}

// 💾 Save glyph
function saveGlyph() {
  const char = document.getElementById("charInput").value;

  if (!char) {
    alert("Enter a letter!");
    return;
  }

  glyphs[char] = [...points];
  clearCanvas();
  alert(`Saved "${char}"`);
}

// 🔤 Convert to path
function createPath(points) {
  const path = new opentype.Path();

  if (!points.length) return path;

  path.moveTo(points[0].x, 200 - points[0].y);

  points.forEach(p => {
    path.lineTo(p.x, 200 - p.y);
  });

  return path;
}

// ⚡ Generate font
function generateFont() {
  const glyphArray = [];

  Object.keys(glyphs).forEach(char => {
    const path = createPath(glyphs[char]);

    const glyph = new opentype.Glyph({
      name: char,
      unicode: char.charCodeAt(0),
      advanceWidth: 600,
      path: path
    });

    glyphArray.push(glyph);
  });

  const font = new opentype.Font({
    familyName: "KibaFont",
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

// 👀 Load preview
function loadPreview(buffer) {
  const blob = new Blob([buffer], { type: "font/ttf" });
  const url = URL.createObjectURL(blob);

  const style = document.createElement("style");
  style.innerHTML = `
    @font-face {
      font-family: "KibaFont";
      src: url(${url});
    }
  `;

  document.head.appendChild(style);
  document.getElementById("preview").style.fontFamily = "KibaFont";
}

// 📥 Download
function downloadFont() {
  if (!fontBuffer) {
    alert("Generate font first!");
    return;
  }

  const blob = new Blob([fontBuffer], { type: "font/ttf" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "KibaFont.ttf";
  link.click();
}

// 🔤 Live preview
document.getElementById("textInput").addEventListener("input", e => {
  document.getElementById("preview").textContent = e.target.value;
});

// 🖱️ Desktop events
canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseleave", stopDrawing);

// 📱 Mobile events
canvas.addEventListener("touchstart", startDrawing, { passive: false });
canvas.addEventListener("touchmove", draw, { passive: false });
canvas.addEventListener("touchend", stopDrawing);
