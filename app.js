let projects = JSON.parse(localStorage.getItem("kfont_projects")) || {};
let currentProject = null;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = canvas.offsetWidth;
canvas.height = 220;

let drawing = false;
let points = [];
let undoStack = [];
let redoStack = [];
let fontBuffer = null;

// ---------- PROJECT ----------

function createProject() {
  const name = document.getElementById("projectName").value;
  if (!name) return alert("Enter name");

  projects[name] = { glyphs: {} };
  saveLocal();
  renderProjects();
}

function renderProjects() {
  const list = document.getElementById("projectList");
  list.innerHTML = "";

  Object.keys(projects).forEach(name => {
    const div = document.createElement("div");
    div.className = "project-item";

    div.innerHTML = `
      <span>${name}</span>
      <button onclick="openProject('${name}')">Open</button>
    `;

    list.appendChild(div);
  });
}

function openProject(name) {
  currentProject = name;
  document.getElementById("projectPanel").style.display = "none";
  document.getElementById("appUI").style.display = "block";
  document.getElementById("currentProject").innerText = name;
}

function backToProjects() {
  document.getElementById("projectPanel").style.display = "block";
  document.getElementById("appUI").style.display = "none";
}

function saveLocal() {
  localStorage.setItem("kfont_projects", JSON.stringify(projects));
}

// ---------- DRAW ----------

function getPos(e) {
  const rect = canvas.getBoundingClientRect();

  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }

  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function start(e) {
  e.preventDefault();
  drawing = true;
  points = [];

  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

  const pos = getPos(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
  if (!drawing) return;
  e.preventDefault();

  const pos = getPos(e);
  points.push(pos);

  ctx.lineWidth = 4;
  ctx.lineCap = "round";

  const prev = points[points.length - 2];
  if (prev) {
    const midX = (prev.x + pos.x) / 2;
    const midY = (prev.y + pos.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
  }

  ctx.stroke();
}

function stop() {
  drawing = false;
}

canvas.addEventListener("mousedown", start);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stop);
canvas.addEventListener("mouseleave", stop);

canvas.addEventListener("touchstart", start, { passive: false });
canvas.addEventListener("touchmove", draw, { passive: false });
canvas.addEventListener("touchend", stop);

// ---------- UNDO ----------

function undo() {
  if (!undoStack.length) return;
  redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  ctx.putImageData(undoStack.pop(), 0, 0);
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
  ctx.putImageData(redoStack.pop(), 0, 0);
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ---------- SAVE GLYPH ----------

function saveGlyph() {
  const char = document.getElementById("charInput").value;
  if (!char) return alert("Enter letter");

  projects[currentProject].glyphs[char] = [...points];
  alert("Saved " + char);
}

// ---------- FONT ----------

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

  normalized.forEach(p => {
    path.lineTo(p.x, 800 - p.y);
  });

  return path;
}

function generateFont() {
  const glyphArray = [];

  Object.keys(projects[currentProject].glyphs).forEach(char => {
    const path = createPath(projects[currentProject].glyphs[char]);

    glyphArray.push(new opentype.Glyph({
      name: char,
      unicode: char.charCodeAt(0),
      advanceWidth: 600,
      path
    }));
  });

  const font = new opentype.Font({
    familyName: currentProject,
    styleName: "Regular",
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs: glyphArray
  });

  fontBuffer = font.toArrayBuffer();
  loadPreview(fontBuffer);
}

function loadPreview(buffer) {
  const blob = new Blob([buffer], { type: "font/ttf" });
  const url = URL.createObjectURL(blob);

  const style = document.createElement("style");
  style.innerHTML = `
    @font-face {
      font-family: "${currentProject}";
      src: url(${url});
    }
  `;

  document.head.appendChild(style);
  document.getElementById("preview").style.fontFamily = currentProject;
}

// ---------- DOWNLOAD ----------

function downloadFont() {
  if (!fontBuffer) return alert("Generate first");

  const blob = new Blob([fontBuffer], { type: "font/ttf" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = currentProject + ".ttf";
  link.click();
}

// ---------- CLOUD ----------

async function saveProjectOnline() {
  await setDoc(doc(db, "projects", currentProject), {
    glyphs: projects[currentProject].glyphs
  });

  alert("Saved to cloud ☁️");
}

async function loadProjectOnline(name) {
  const ref = doc(db, "projects", name);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    projects[name] = snap.data();
    openProject(name);
    alert("Loaded from cloud 🚀");
  } else {
    alert("No cloud data");
  }
}

// ---------- INIT ----------
renderProjects();

document.getElementById("textInput").addEventListener("input", e => {
  document.getElementById("preview").textContent = e.target.value;
});
