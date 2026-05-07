const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let points = [];
let glyphs = {};
let fontBuffer = null;

canvas.onmousedown = () => {
  drawing = true;
  points = [];
};

canvas.onmouseup = () => drawing = false;

canvas.onmousemove = (e) => {
  if (!drawing) return;

  const x = e.offsetX;
  const y = e.offsetY;

  points.push({ x, y });

  ctx.lineWidth = 3;
  ctx.lineCap = "round";

  ctx.lineTo(x, y);
  ctx.stroke();
};

// Clear canvas
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
}

// Save letter drawing
function saveGlyph() {
  const char = document.getElementById("charInput").value;
  if (!char) {
    alert("Enter a letter!");
    return;
  }

  glyphs[char] = [...points];
  alert(`Saved ${char}`);
  clearCanvas();
}

// Convert points to path
function createPath(points) {
  const path = new opentype.Path();

  if (points.length === 0) return path;

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
      path: path
    });

    glyphArray.push(glyph);
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

// Load font for preview
function loadPreview(buffer) {
  const blob = new Blob([buffer], { type: "font/ttf" });
  const url = URL.createObjectURL(blob);

  const style = document.createElement("style");
  style.innerHTML = `
    @font-face {
      font-family: "MyFont";
      src: url(${url});
    }
  `;
  document.head.appendChild(style);

  document.getElementById("preview").style.fontFamily = "MyFont";
}

// Download font
function downloadFont() {
  if (!fontBuffer) {
    alert("Generate font first!");
    return;
  }

  const blob = new Blob([fontBuffer], { type: "font/ttf" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "MyFont.ttf";
  link.click();
}

// Live preview typing
const input = document.getElementById("textInput");
const preview = document.getElementById("preview");

input.addEventListener("input", () => {
  preview.textContent = input.value;
});