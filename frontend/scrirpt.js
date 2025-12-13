async function analyze() {
  const fileInput = document.getElementById("imageInput");
  const file = fileInput.files[0];

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://localhost:8000/analyze", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  document.getElementById("result").classList.remove("hidden");
  document.getElementById("status").innerText = data.health_status;
  document.getElementById("overall").value = data.overall_health;
  document.getElementById("moisture").value = data.moisture;
  document.getElementById("color").value = data.color_match;
}
