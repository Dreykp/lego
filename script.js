const cardsContainer = document.getElementById("cards-container");
const template = document.getElementById("card-template");
const searchInput = document.getElementById("search");
const categorySelect = document.getElementById("category");
const difficultySelect = document.getElementById("difficulty");
const statsEl = document.getElementById("stats");
const emptyMessageEl = document.getElementById("empty-message");

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

    if (item.image_url) {
      image.src = item.image_url;
      image.alt = `Назва моделі LEGO WeDo: ${item.title}`;
    } else {
      card.classList.add("card--no-image");
      if (imageWrapper) {
        imageWrapper.remove();
      }
    }

    cardsContainer.appendChild(fragment);
  });
}

function updateStats(visibleCount, totalCount) {
  statsEl.textContent = `Показано ${visibleCount} з ${totalCount} інструкцій.`;
}

searchInput.addEventListener("input", applyFilters);
categorySelect.addEventListener("change", applyFilters);
difficultySelect.addEventListener("change", applyFilters);

loadInstructions();
