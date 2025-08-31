let currentPitch = {};

async function generatePitch() {
  const idea = document.getElementById("ideaInput").value.trim();
  if (!idea) { alert("Please enter an idea!"); return; }

  try {
    const response = await fetch("/generate_pitch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea })
    });

    const data = await response.json();
    currentPitch = data;

    const display = document.getElementById("pitchDisplay");
    display.innerHTML = "<h2> Your Pitch Deck</h2>";

    ["idea", "problem", "solution", "market", "tagline"].forEach(key => {
      const p = document.createElement("p");
      p.innerHTML = `<b>${key.charAt(0).toUpperCase() + key.slice(1)}:</b> ${data[key]}`;
      display.appendChild(p);
    });

    display.style.display = "block";

  } catch (err) {
    console.error("Frontend fetch error:", err);
    alert("Failed to generate pitch. Check backend console.");
  }
}

function downloadPDF() {
  if (!currentPitch.idea) { alert("Generate a pitch first!"); return; }

  const doc = new window.jspdf.jsPDF();
  const slides = [
    {title: "The Idea", content: currentPitch.idea},
    {title: "Problem", content: currentPitch.problem},
    {title: "Solution", content: currentPitch.solution},
    {title: "Market", content: currentPitch.market},
    {title: "Tagline", content: currentPitch.tagline}
  ];

  slides.forEach((slide, index) => {
    doc.setFillColor(245, 245, 220);
    doc.rect(0, 0, 210, 297, "F");

    doc.setTextColor(0,0,0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);

    doc.text(slide.title, 105, 50, {align:"center"});
    doc.setFontSize(18);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(slide.content, 180), 15, 80);

    if(index < slides.length-1) doc.addPage();
  });

  doc.save(`${currentPitch.idea.replace(/ /g,"_")}_pitch.pdf`);
}
