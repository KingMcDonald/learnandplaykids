const countBtn = document.getElementById("countBtn");

function loadQuestion(question) {
  document.getElementById("questionText").textContent = question.question;

  // ✅ Show button ONLY for number activity
  if (question.showCountButton) {
    countBtn.classList.remove("hidden");
    countBtn.textContent = question.countButtonText;

    countBtn.onclick = () => {
      openCountModal(question);
    };
  } else {
    countBtn.classList.add("hidden");
  }
}

function openCountModal(question) {
  modalTitle.textContent = question.modalTitle;
  modalObjects.innerHTML = question.modalObjects
    .map((o) => `<span>${o}</span>`)
    .join("");

  modal.classList.remove("hidden");
}
