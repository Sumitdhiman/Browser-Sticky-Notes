// Reference to the text area
const textArea = document.getElementById("textArea");

// Load saved content from local storage
textArea.value = localStorage.getItem("textAreaContent") || "";

// Save content to local storage on input
textArea.addEventListener("input", () => {
  localStorage.setItem("textAreaContent", textArea.value);
});
