const cardsContainer = document.getElementById("cards-container");
const template = document.getElementById("card-template");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const difficultySelect = document.getElementById("difficulty");
const statsEl = document.getElementById("stats");
const emptyMessageEl = document.getElementById("empty-message");
const pdfModal = document.getElementById("pdf-modal");
const pdfFrame = document.getElementById("pdf-frame");
const pdfClose = document.getElementById("pdf-close");
const pdfModalTitle = document.getElementById("pdf-modal-title");

let allInstructions = [];

async function loadInstructions() {
  statsEl.textContent = "Завантаження даних…";

  try {
    const response = await fetch("instructions.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Response not ok");
    }

    const data = await response.json();
    allInstructions = Array.isArray(data) ? data : [];

    populateCategories(allInstructions);
    applyFilters();
  } catch (error) {
    console.error("Помилка завантаження даних:", error);
    const localHint =
      window.location.protocol === "file:"
        ? "Відкрий сторінку через локальний сервер (наприклад, python -m http.server) або GitHub Pages."
        : "Перевір, чи існує файл instructions.json і чи доступний він за цією адресою.";
    statsEl.textContent = `Не вдалося завантажити дані. ${localHint}`;
  }
}

function populateCategories(instructions) {
  const categories = Array.from(
    new Set(instructions.map((item) => item.category).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

function applyFilters() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const selectedCategory = categorySelect.value;
  const selectedDifficulty = difficultySelect.value;

  const filtered = allInstructions.filter((item) => {
    const haystack = [
      item.title || "",
      item.description || "",
      Array.isArray(item.tags) ? item.tags.join(" ") : ""
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = haystack.includes(searchTerm);
    const matchesCategory =
      !selectedCategory || item.category === selectedCategory;
    const matchesDifficulty =
      !selectedDifficulty ||
      String(item.difficulty) === String(selectedDifficulty);

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  renderCards(filtered);
  updateStats(filtered.length, allInstructions.length);
  emptyMessageEl.hidden = filtered.length !== 0;
}

function renderCards(list) {
  cardsContainer.innerHTML = "";

  list.forEach((item) => {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".card");
    const imageWrapper = fragment.querySelector(".card-image-wrapper");
    const image = fragment.querySelector(".card-image");
    const title = fragment.querySelector(".card-title");
    const meta = fragment.querySelector(".card-meta");
    const description = fragment.querySelector(".card-description");
    const tagsContainer = fragment.querySelector(".card-tags");
    const link = fragment.querySelector(".card-link");
    const previewBtn = fragment.querySelector(".card-preview");

    const category = item.category || "Без категорії";
    const difficulty = item.difficulty ? `${item.difficulty}/5` : "—";

    title.textContent = item.title || "Без назви";
    meta.textContent = `Категорія: ${category} • Складність: ${difficulty}`;
    description.textContent =
      item.description || "Опис для цієї моделі відсутній.";

    if (Array.isArray(item.tags) && item.tags.length > 0) {
      item.tags.forEach((tag) => {
        const tagEl = document.createElement("span");
        tagEl.className = "card-tag";
        tagEl.textContent = tag;
        tagsContainer.appendChild(tagEl);
      });
    }

    link.href = item.pdf_url;
    link.setAttribute("aria-label", `Відкрити інструкцію ${title.textContent}`);

    const imageSrc = resolveImageUrl(item.image_url);
    if (imageSrc) {
      image.src = imageSrc;
      image.alt = `Назва моделі LEGO WeDo: ${item.title}`;
    } else {
      card.classList.add("card--no-image");
      if (imageWrapper) {
        imageWrapper.remove();
      }
    }

    const previewUrl = getPreviewUrl(item.pdf_url);
    previewBtn.addEventListener("click", () =>
      openPdfModal(previewUrl, item.title)
    );

    cardsContainer.appendChild(fragment);
  });
}

function updateStats(visibleCount, totalCount) {
  statsEl.textContent = `Показано ${visibleCount} з ${totalCount} інструкцій.`;
}

function resolveImageUrl(url) {
  if (!url) return "";
  const normalized = url.trim();
  const isAbsolute =
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("/") ||
    normalized.startsWith("./") ||
    normalized.startsWith("../") ||
    normalized.startsWith("data:");
  if (isAbsolute) return normalized;
  // Якщо у JSON вказано лише ім'я файлу, шукаємо його в папці img/ поруч із сайтом.
  return `img/${normalized}`;
}

function getPreviewUrl(url) {
  if (!url) return "";
  const driveMatch = url.match(/https:\/\/drive\.google\.com\/file\/d\/([^/]+)\//);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  return url;
}

function openPdfModal(url, title) {
  if (!url) return;
  pdfFrame.src = url;
  pdfModalTitle.textContent = title ? `PDF: ${title}` : "PDF інструкція";
  pdfModal.hidden = false;
  document.body.classList.add("no-scroll");
}

function closePdfModal() {
  pdfModal.hidden = true;
  pdfFrame.src = "";
  document.body.classList.remove("no-scroll");
}

searchInput.addEventListener("input", applyFilters);
categorySelect.addEventListener("change", applyFilters);
difficultySelect.addEventListener("change", applyFilters);
pdfClose.addEventListener("click", closePdfModal);
pdfModal.addEventListener("click", (event) => {
  if (event.target === pdfModal || event.target.classList.contains("modal__backdrop")) {
    closePdfModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !pdfModal.hidden) {
    closePdfModal();
  }
});

loadInstructions();
