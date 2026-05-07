const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = canvas.offsetWidth;
canvas.height = 250;

let drawing = false;
let points = [];
let glyphs = {};
let fontBuffer = null;

const brushSize = document.getElementById("brushSize");

// Get position
function getPos(e) {
  if (e.touches) {
    return {
      x: e.touches[0].clientX - canvas.getBoundingClientRect().left,
      y: e.touches[0].clientY - canvas.getBoundingClientRect().top
    };
  }
  return { x: e.offsetX, y: e.offsetY };
}

// Start
canvas.addEventListener("mousedown", start);
canvas.addEventListener("touchstart", start, { passive: false });

function start(e) {
  e.preventDefault();
  drawing = true;
  points = [];

  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

// Stop
canvas.addEventListener("mouseup", stop);
canvas.addEventListener("mouseleave", stop);
canvas.addEventListener("touchend", stop);

function stop() {
  drawing = false;
}

// Draw (with smoothing)
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("touchmove", draw, { passive: false });

function draw(e) {
  if (!drawing) return;
  e.preventDefault();

  const pos = getPos(e);
  points.push(pos);

  ctx.lineWidth = brushSize.value;
  ctx.lineCap = "round";

  // ✨ simple smoothing
  const last = points[points.length - 2];
  if (last) {
    ctx.quadraticCurveTo(last.x, last.y, pos.x, pos.y);
  } else {
    ctx.lineTo(pos.x, pos.y);
  }

  ctx.stroke();
}

// Clear
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
}

// Save
function saveGlyph() {
  const char = document.getElementById("charInput").value;
  if (!char) return alert("Enter a letter");

  glyphs[char] = [...points];
  clearCanvas();
  alert(`Saved ${char}`);
}

// Convert path
function createPath(points) {
  const path = new opentype.Path();
  if (!points.length) return path;

  path.moveTo(points[0].x, 200 - points[0].y);

  points.forEach(p => {
    path.lineTo(p.x, 200 - p.y);
  });

  return path;
}

// Generate font
function generateFont() {
  const glyphArray = [];

  Object.keys(glyphs).forEach(char => {
    const path = createPath(glyphs[char]);

    const glyph = new opentype.Glyph({
      name: char,
      unicode: char.charCodeAt(0),
      advanceWidth: 600,
      path
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

  alert("Font Ready!");
}

// Preview
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

// Download
function downloadFont() {
  if (!fontBuffer) return alert("Generate first");

  const blob = new Blob([fontBuffer], { type: "font/ttf" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "KibaFont.ttf";
  link.click();
}

// Live preview
document.getElementById("textInput").addEventListener("input", e => {
  document.getElementById("preview").textContent = e.target.value;
});
