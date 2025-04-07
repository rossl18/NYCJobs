function removeDuplicates(companies) {
  const unique = [];
  const seen = new Set();
  companies.forEach(company => {
    const key = company.name.toLowerCase() + company.careerUrl.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(company);
    }
  });
  return unique;
}

function showError(title, details = '') {
  const errorHtml = `
    <div style="color: red; padding: 20px; border: 1px solid red; margin: 20px;">
      <h3>${title}</h3>
      <p>${details}</p>
      <p>Click F12 → Console for technical details</p>
    </div>
  `;
  document.body.insertAdjacentHTML('afterbegin', errorHtml);
}

/** localStorage: array of visited career URLs */
function getVisitedCompanies() {
  return JSON.parse(localStorage.getItem('visitedCompanies') || '[]');
}
function saveVisitedCompany(url) {
  const visited = getVisitedCompanies();
  if (!visited.includes(url)) {
    visited.push(url);
    localStorage.setItem('visitedCompanies', JSON.stringify(visited));
  }
}
function removeVisitedCompany(url) {
  let visited = getVisitedCompanies();
  visited = visited.filter(u => u !== url);
  localStorage.setItem('visitedCompanies', JSON.stringify(visited));
}

document.addEventListener('DOMContentLoaded', async () => {
  // Grab DOM elements
  const listElement = document.getElementById('company-list');
  const searchInput = document.getElementById('search-input');
  const filtersContainer = document.getElementById('industry-filters');
  const sortSelect = document.getElementById('sort-select');
  const clearFiltersBtn = document.getElementById('clear-filters');

  // Quick check to prevent null references
  if (!listElement || !searchInput || !filtersContainer || !sortSelect || !clearFiltersBtn) {
    showError('Error: Could not find required elements in HTML');
    return;
  }

  let data = null;

  // Function that (re)renders the companies list
  const renderCompanies = () => {
    if (!data || !data.companies) return; // If data is missing, do nothing

    const searchTerm = searchInput.value.toLowerCase();
    const selectedIndustries = Array.from(document.querySelectorAll('.industry-filter:checked'))
      .map(cb => cb.value);
    const visited = getVisitedCompanies();

    // Filter
    let filtered = data.companies.filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchTerm) ||
        (company.industry && company.industry.toLowerCase().includes(searchTerm));
      const matchesIndustry = selectedIndustries.includes(company.industry);
      return matchesSearch && matchesIndustry;
    });

    // Sort
    const sortOrder = sortSelect.value; // 'az' or 'za'
    filtered.sort((a, b) => {
      if (sortOrder === 'za') {
        return b.name.localeCompare(a.name);
      } else { 
        return a.name.localeCompare(b.name);
      }
    });

    // Render
    if (filtered.length === 0) {
      listElement.innerHTML = '<div class="no-results">No companies match your search and filters</div>';
    } else {
      listElement.innerHTML = filtered.map(company => {
        const isVisited = visited.includes(company.careerUrl);
        return `
          <div class="company-entry ${isVisited ? 'visited-company' : ''}">
            <div>
              <input 
                type="checkbox" 
                class="visited-checkbox" 
                data-url="${company.careerUrl}"
                ${isVisited ? 'checked' : ''}>
              <a href="${company.careerUrl}" 
                 class="company-link" 
                 target="_blank">
                ${company.name}
                ${company.industry ? `<span class="industry-tag">(${company.industry})</span>` : ''}
              </a>
            </div>
          </div>
        `;
      }).join('');

      // Hook up the visited checkboxes
      document.querySelectorAll('.visited-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', e => {
          const url = e.target.dataset.url;
          if (e.target.checked) {
            saveVisitedCompany(url);
          } else {
            removeVisitedCompany(url);
          }
          // Re-render to show highlight
          renderCompanies();
        });
      });
    }
  };

  try {
    // Try only the local "companies.json" in the same folder as index.html
    const response = await fetch('companies.json');
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    data = await response.json();
    data.companies = removeDuplicates(data.companies);

    // Build the industry checkboxes
    const industries = [...new Set(
      data.companies.map(c => c.industry).filter(Boolean)
    )].sort();

    filtersContainer.innerHTML = industries.map(industry => {
      const idVal = industry.toLowerCase().replace(/\s+/g, '-');
      return `
        <div class="filter-option">
          <input type="checkbox"
                 id="filter-${idVal}"
                 class="filter-checkbox industry-filter"
                 value="${industry}"
                 checked>
          <label for="filter-${idVal}" class="filter-label">${industry}</label>
        </div>
      `;
    }).join('');

    // Clear filters => re-check every box => re-render
    clearFiltersBtn.addEventListener('click', () => {
      document.querySelectorAll('.industry-filter').forEach(cb => {
        cb.checked = true;
      });
      renderCompanies();
    });

    // Listen for any filter changes
    document.querySelectorAll('.industry-filter').forEach(cb => {
      cb.addEventListener('change', renderCompanies);
    });

    // Sorting
    sortSelect.addEventListener('change', renderCompanies);

    // Search box
    searchInput.addEventListener('input', renderCompanies);

    // Initial render
    renderCompanies();

  } catch (err) {
    showError(`Failed to load companies.json: ${err.message}`, 'Check the browser console for details');
    console.error('Debug info:', err);
  }
});
