// ===== CANVAS =====
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const size = 64;
const pixelSize = 5;

canvas.width = size * pixelSize;
canvas.height = size * pixelSize;

let tool = "draw";
let drawing = false;
let color = "#ff0000";

// ===== TOOL =====
function setTool(t) {
  tool = t;
}

// ===== COLOR =====
document.getElementById("colorPicker").addEventListener("input", e => {
  color = e.target.value;
});

// ===== POSITION =====
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor((e.clientX - rect.left) / pixelSize),
    y: Math.floor((e.clientY - rect.top) / pixelSize)
  };
}

// ===== DRAW =====
function drawPixel(x, y) {
  if (tool === "erase") {
    ctx.clearRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  }
}

canvas.addEventListener("pointerdown", e => {
  drawing = true;
  const pos = getPos(e);
  drawPixel(pos.x, pos.y);
  update3D();
});

canvas.addEventListener("pointermove", e => {
  if (!drawing) return;
  const pos = getPos(e);
  drawPixel(pos.x, pos.y);
  update3D();
});

canvas.addEventListener("pointerup", () => drawing = false);
canvas.addEventListener("pointerleave", () => drawing = false);

// ===== CLEAR =====
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update3D();
}

// ===== UPLOAD =====
document.getElementById("upload").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    update3D();
  };
  img.src = URL.createObjectURL(file);
});

// ===== DOWNLOAD =====
function downloadImage() {
  const link = document.createElement("a");
  link.download = "skin.png";
  link.href = canvas.toDataURL();
  link.click();
}

// ===== THREE.JS =====
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

let renderer = new THREE.WebGLRenderer();
renderer.setSize(200, 200);
document.getElementById("threeContainer").appendChild(renderer.domElement);

camera.position.z = 2;

let texture = new THREE.Texture(canvas);
texture.needsUpdate = true;

let material = new THREE.MeshBasicMaterial({ map: texture });
let cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);

scene.add(cube);

function update3D() {
  texture.needsUpdate = true;
}

function animate() {
  requestAnimationFrame(animate);
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
animate();

// ===== FIREBASE SHARE =====
async function shareSkin() {
  const data = canvas.toDataURL();

  await addDoc(collection(db, "skins"), {
    image: data,
    time: Date.now()
  });

  alert("Shared to community 🚀");
  loadGallery();
}

// ===== LOAD GALLERY =====
async function loadGallery() {
  const snapshot = await getDocs(collection(db, "skins"));

  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  snapshot.forEach(doc => {
    const img = document.createElement("img");
    img.src = doc.data().image;
    img.width = 80;
    gallery.appendChild(img);
  });
}

loadGallery();
