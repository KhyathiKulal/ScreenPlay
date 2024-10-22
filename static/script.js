let frag = `
    vec4 abyssColor = vec4(0, 0, 0, 0);
    vec4 tunnelColor = vec4(1.5, 1.2, 1.1, 1);
    uniform float time;
    uniform vec2 resolution;
    void main() {
        vec2 uv = ( gl_FragCoord.xy - .5 * resolution.xy) / resolution.y * 0.6;
        float r = length(uv);
        float y = fract( r / 0.005 / ( r - 0.01 ) + time * 1.);
        y = smoothstep( 0.01, 4., y );
        float x = length(uv);
        x = smoothstep( 0.5, .01, x );
        gl_FragColor = mix( tunnelColor, abyssColor, x ) * y;
    }
`;
let scene, camera, renderer, animationId;
let uniforms, geometry, material, mesh;
let startTime = Date.now();
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,window.innerWidth / window.innerHeight,1,2
  );
  camera.position.z = 1;
  geometry = new THREE.PlaneGeometry(10, 10);
  material = new THREE.ShaderMaterial({
    uniforms: {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
    },
    fragmentShader: frag,
  });
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.getElementById("tunnelCanvas"),
  });
  material.uniforms.resolution.value.x = window.innerWidth;
  material.uniforms.resolution.value.y = window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
}
function animate() {
  animationId = requestAnimationFrame(animate);
  let elapsedMilliseconds = Date.now() - startTime;
  material.uniforms.time.value = elapsedMilliseconds / 1000;
  renderer.render(scene, camera);
}
function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  material.uniforms.resolution.value.x = window.innerWidth;
  material.uniforms.resolution.value.y = window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
}
init();
animate();
window.addEventListener("resize", resize);
function typeWriter(text, i, callback) {
  if (i < text.length) {
    document.getElementById("welcome-text").innerHTML += text.charAt(i);
    i++;
    setTimeout(() => typeWriter(text, i, callback), 100);
  } else if (callback) {
    callback();
  }
}
document.addEventListener("DOMContentLoaded", function () {
  const welcomeTextElement = document.getElementById("welcome-text");
  welcomeTextElement.innerHTML = "";
  const welcomeMessage = "Welcome to ScreenPlay";
  typeWriter(welcomeMessage, 0);
});
let isRecording = false;
const recordButton = document.getElementById("record-btn");
const boxElement = document.querySelector(".box");
const welcomeTextElement = document.getElementById("welcome-text");
const outputTextArea = document.getElementById("output");
const submitButton = document.getElementById("submit-btn");
const submitContainer = document.getElementById("submit-container");
const downloadContainer = document.getElementById("download-container");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.onstart = function () {
  outputTextArea.value = "";
};
recognition.onresult = function (event) {
  const transcript = event.results[0][0].transcript;
  outputTextArea.value += transcript + " ";
  toggleSubmitButton();
};
recognition.onerror = function (event) {
  console.error("Error occurred in recognition: " + event.error);
};
function toggleSubmitButton() {
  if (outputTextArea.value.trim() !== "") {
    submitContainer.style.display = "block";
  } else {
    submitContainer.style.display = "none";
  }
}
outputTextArea.addEventListener("input", toggleSubmitButton);
recordButton.addEventListener("click", function () {
  isRecording = !isRecording;
  if (isRecording) {
    recordButton.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
    recordButton.classList.remove("btn-success");
    recordButton.classList.add("btn-danger");
    boxElement.classList.add("highlighted");
    welcomeTextElement.classList.add("highlighted-text");
    recognition.start();
  } else {
    recordButton.innerHTML =
      '<i class="fas fa-microphone"></i> Start Recording';
    recordButton.classList.remove("btn-danger");
    recordButton.classList.add("btn-success");
    boxElement.classList.remove("highlighted");
    welcomeTextElement.classList.remove("highlighted-text");
    recognition.stop();
  }
});
submitButton.addEventListener("click", function () {
  const promptText = outputTextArea.value.trim();
  if (promptText !== "") {
    fetch('http://127.0.0.1:5000/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: promptText })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log(data);
      if (data.screenplay) {
        outputTextArea.value = data.screenplay;
        downloadContainer.style.display = "block";
      }
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
  }
});
function downloadScreenplay() {
  const screenplayText = outputTextArea.value;
  const blob = new Blob([screenplayText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'screenplay.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
document.getElementById("download-btn").addEventListener("click", downloadScreenplay);
