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

/** Get array of visited career URLs from localStorage */
function getVisitedCompanies() {
  return JSON.parse(localStorage.getItem('visitedCompanies') || '[]');
}

/** Add a visited URL to localStorage */
function saveVisitedCompany(url) {
  const visited = getVisitedCompanies();
  if (!visited.includes(url)) {
    visited.push(url);
    localStorage.setItem('visitedCompanies', JSON.stringify(visited));
  }
}

/** Remove a visited URL from localStorage */
function removeVisitedCompany(url) {
  let visited = getVisitedCompanies();
  visited = visited.filter(u => u !== url);
  localStorage.setItem('visitedCompanies', JSON.stringify(visited));
}

document.addEventListener('DOMContentLoaded', async () => {
  // Grab references
  const listElement = document.getElementById('company-list');
  const searchInput = document.getElementById('search-input');
  const filtersContainer = document.getElementById('industry-filters');
  const sortSelect = document.getElementById('sort-select');
  const clearFiltersBtn = document.getElementById('clear-filters');

  // Basic sanity check
  if (!listElement || !searchInput || !filtersContainer || !sortSelect || !clearFiltersBtn) {
    showError('Error: Could not find required elements in HTML');
    return;
  }

  let data;
  // We'll define renderCompanies now, but we need data to be loaded
  const renderCompanies = () => {
    // If data hasn't loaded for some reason, do nothing
    if (!data || !data.companies) return;

    const searchTerm = searchInput.value.toLowerCase();
    // Which industries are checked?
    const selectedIndustries = Array
      .from(document.querySelectorAll('.industry-filter:checked'))
      .map(cb => cb.value);

    const visited = getVisitedCompanies();

    // Filter list
    let filtered = data.companies.filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchTerm) ||
        (company.industry && company.industry.toLowerCase().includes(searchTerm));
      // Industry must match if it’s checked
      const matchesIndustry = selectedIndustries.includes(company.industry);
      return matchesSearch && matchesIndustry;
    });

    // Sort
    const sortOrder = sortSelect.value; // 'az' or 'za'
    filtered.sort((a, b) => {
      if (sortOrder === 'za') {
        return b.name.localeCompare(a.name);
      } else {
        // Default: A–Z
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

      // Attach checkbox event listeners
      document.querySelectorAll('.visited-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const url = e.target.dataset.url;
          if (e.target.checked) {
            saveVisitedCompany(url);
          } else {
            removeVisitedCompany(url);
          }
          // Re-render to show updated highlight
          renderCompanies();
        });
      });
    }
  };

  // Try to load data from multiple possible JSON paths
  try {
    const jsonPaths = [
      'companies.json',
      '../companies.json',
      'docs/companies.json',
      'NYCJobs/docs/companies.json'
    ];

    let lastError;
    for (const path of jsonPaths) {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          lastError = `HTTP error! Status: ${response.status} for ${path}`;
          continue;
        }
        data = await response.json();
        // If successful, break
        break;
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!data) {
      throw new Error(`All paths failed. Last error: ${lastError}`);
    }

    // De-dupe in case of overlap
    data.companies = removeDuplicates(data.companies);

    // Build a sorted list of unique industries
    const industries = [...new Set(
      data.companies.map(c => c.industry).filter(Boolean)
    )].sort();

    // Insert checkboxes for each industry
    filtersContainer.innerHTML = industries.map(industry => {
      const idVal = industry.toLowerCase().replace(/\s+/g, '-');
      return `
        <div class="filter-option">
          <input type="checkbox" 
                 id="filter-${idVal}"
                 class="filter-checkbox industry-filter" 
                 value="${industry}"
                 checked>
          <label for="filter-${idVal}" 
                 class="filter-label">${industry}</label>
        </div>
      `;
    }).join('');

    // Attach event listeners
    // Clear all filters => re-check every filter => re-render
    clearFiltersBtn.addEventListener('click', () => {
      document.querySelectorAll('.industry-filter').forEach(cb => cb.checked = true);
      renderCompanies();
    });

    // Re-render whenever filters or sort change
    document.querySelectorAll('.industry-filter').forEach(cb => {
      cb.addEventListener('change', renderCompanies);
    });
    sortSelect.addEventListener('change', renderCompanies);

    // Search input => re-render on typing
    searchInput.addEventListener('input', renderCompanies);

    // Initial render
    renderCompanies();

  } catch (error) {
    showError(`Failed to load companies: ${error.message}`, 'Check the browser console (F12) for details');
    console.error('Debug info:', {
      error,
      windowLocation: window.location.href
    });
  }
});
