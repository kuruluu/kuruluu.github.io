const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const yearEl = document.getElementById('year');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

const tierSlots = document.querySelectorAll('.tier-images-slot');
const tierDetailLists = document.querySelectorAll('.tier-detail-list');
const spreadsheetUrl = 'https://docs.google.com/spreadsheets/d/1QzCZvXiOrCIlM_qEvNVyFw7fqAGfH9-Ec5xmc_CG6NE/gviz/tq?tqx=out:json&gid=0';

function normalizeRating(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getCellValue(cell) {
  if (!cell) return '';
  if (typeof cell === 'string') return cell;
  if (typeof cell === 'number') return String(cell);
  return cell.v ?? '';
}

function cleanUrl(value) {
  return String(value || '').trim();
}

function scrollToTier(rating) {
  const target = document.querySelector(`.tier-detail-group[data-tier-detail="${rating}"]`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function buildCard(item) {
  const card = document.createElement('div');
  card.className = 'tier-image-card';
  card.dataset.rating = item.rating;
  card.title = item.name || 'Game';

  const img = document.createElement('img');
  img.src = item.image;
  img.alt = item.name || 'Tier list entry';
  img.loading = 'lazy';

  const tooltip = document.createElement('div');
  tooltip.className = 'tier-hover-tooltip';

  const tooltipName = document.createElement('span');
  tooltipName.className = 'tier-hover-name';
  tooltipName.textContent = item.name || 'Game';

  const tooltipSubtext = document.createElement('span');
  tooltipSubtext.className = 'tier-hover-subtext';
  tooltipSubtext.textContent = 'Click to view description';

  tooltip.appendChild(tooltipName);
  tooltip.appendChild(tooltipSubtext);
  card.appendChild(img);
  card.appendChild(tooltip);

  card.addEventListener('mouseenter', () => {
    card.classList.add('is-hovered');
  });

  card.addEventListener('mouseleave', () => {
    card.classList.remove('is-hovered');
  });

  card.addEventListener('click', () => {
    scrollToTier(item.rating);
  });

  return card;
}

function buildDetailItem(item) {
  const itemEl = document.createElement('div');
  itemEl.className = 'tier-detail-item';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'tier-detail-image';

  const img = document.createElement('img');
  img.src = item.image;
  img.alt = item.name || 'Game';
  img.loading = 'lazy';

  imageWrap.appendChild(img);

  const textWrap = document.createElement('div');
  textWrap.className = 'tier-detail-text';

  const title = document.createElement('h3');
  title.textContent = item.name || 'Game';

  const desc = document.createElement('p');
  desc.textContent = item.description || '';

  textWrap.appendChild(title);
  textWrap.appendChild(desc);

  itemEl.appendChild(imageWrap);
  itemEl.appendChild(textWrap);
  return itemEl;
}

async function loadTierData() {
  try {
    const response = await fetch(spreadsheetUrl);
    if (!response.ok) throw new Error('Failed to fetch spreadsheet');

    const text = await response.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const json = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

    const rows = json?.table?.rows || [];
    const headerRow = rows[0]?.c || [];
    const headerNames = headerRow.map((cell) => normalizeRating(getCellValue(cell)));

    const nameIndex = headerNames.indexOf('name');
    const ratingIndex = headerNames.indexOf('rating');
    const descriptionIndex = headerNames.indexOf('description');
    const imageIndex =
      headerNames.indexOf('image link') !== -1
        ? headerNames.indexOf('image link')
        : headerNames.indexOf('image');

    const entries = rows
      .slice(1)
      .map((row) => {
        const cells = row.c || [];
        const name = getCellValue(cells[nameIndex] || cells[0]);
        const rating = normalizeRating(getCellValue(cells[ratingIndex] || cells[1]));
        const description = getCellValue(cells[descriptionIndex] || cells[2]);
        const image = cleanUrl(getCellValue(cells[imageIndex] || cells[3]));

        if (!image || !rating || rating === 'rating') return null;
        if (!name || name === 'name' || name === 'Name') return null;

        return {
          name,
          rating,
          description,
          image,
        };
      })
      .filter(Boolean);

    tierSlots.forEach((slot) => {
      const tierName = normalizeRating(slot.dataset.tier || '');
      slot.innerHTML = '';

      const matches = entries.filter((entry) => entry.rating === tierName);
      matches.forEach((entry) => slot.appendChild(buildCard(entry)));
    });

    tierDetailLists.forEach((list) => {
      const tierName = normalizeRating(list.dataset.detailTier || '');
      list.innerHTML = '';

      const matches = entries.filter((entry) => entry.rating === tierName);
      matches.forEach((entry) => list.appendChild(buildDetailItem(entry)));
    });
  } catch (error) {
    console.warn('Could not load tier data:', error);
  }
}

loadTierData();
