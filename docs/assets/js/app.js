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
  const listElement = document.getElementById('company-list');
  const searchInput = document.getElementById('search-input');
  const filtersContainer = document.getElementById('industry-filters');
  const sortSelect = document.getElementById('sort-select');
  const clearFiltersBtn = document.getElementById('clear-filters');

  if (!listElement || !searchInput || !filtersContainer || !sortSelect || !clearFiltersBtn) {
    showError('Error: Could not find required elements in HTML');
    return;
  }

  const renderCompanies = () => {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedIndustries = Array.from(document.querySelectorAll('.industry-filter:checked')).map(cb => cb.value);
    const visited = getVisitedCompanies();

    let filtered = data.companies.filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchTerm) || 
                             (company.industry && company.industry.toLowerCase().includes(searchTerm));
      const matchesIndustry = selectedIndustries.includes(company.industry);
      return matchesSearch && matchesIndustry;
    });

    const sortOrder = sortSelect.value;
    filtered.sort((a, b) => {
      return sortOrder === 'za'
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name);
    });

    if (filtered.length === 0) {
      listElement.innerHTML = '<div class="no-results">No companies match your search and filters</div>';
    } else {
      listElement.innerHTML = filtered.map(company => {
        const isVisited = visited.includes(company.careerUrl);
        return `
          <div class="company-entry ${isVisited ? 'visited-company' : ''}">
            <div>
              <input type="checkbox" class="visited-checkbox" data-url="${company.careerUrl}" ${isVisited ? 'checked' : ''}>
              <a href="${company.careerUrl}" class="company-link" target="_blank">
                ${company.name} ${company.industry ? `<span class="industry-tag">(${company.industry})</span>` : ''}
              </a>
            </div>
          </div>
        `;
      }).join('');

      document.querySelectorAll('.visited-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const url = e.target.dataset.url;
          if (e.target.checked) {
            saveVisitedCompany(url);
          } else {
            removeVisitedCompany(url);
          }
          renderCompanies();
        });
      });
    }
  };

  try {
    const jsonPaths = [
      'companies.json',
      '../companies.json',
      'docs/companies.json',
      'NYCJobs/docs/companies.json'
    ];

    let data;
    let lastError;
    for (const path of jsonPaths) {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          lastError = `HTTP error! Status: ${response.status} for ${path}`;
          continue;
        }
        data = await response.json();
        break;
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!data) throw new Error(`All paths failed. Last error: ${lastError}`);

    data.companies = removeDuplicates(data.companies);
    const industries = [...new Set(data.companies.map(c => c.industry).filter(Boolean))].sort();

    filtersContainer.innerHTML = industries.map(industry => `
      <div class="filter-option">
        <input type="checkbox" id="filter-${industry.toLowerCase().replace(/\s+/g, '-')}" 
               class="filter-checkbox industry-filter" value="${industry}" checked>
        <label for="filter-${industry.toLowerCase().replace(/\s+/g, '-')}" 
               class="filter-label">${industry}</label>
      </div>
    `).join('');

    clearFiltersBtn.addEventListener('click', () => {
      document.querySelectorAll('.industry-filter').forEach(cb => cb.checked = true);
      renderCompanies();
    });

    document.querySelectorAll('.industry-filter').forEach(cb => {
      cb.addEventListener('change', renderCompanies);
    });

    sortSelect.addEventListener('change', renderCompanies);
    searchInput.addEventListener('input', renderCompanies);

    renderCompanies();

  } catch (error) {
    showError(`Failed to load companies: ${error.message}`, 'Check the browser console (F12) for details');
    console.error('Debug info:', { error, windowLocation: window.location.href, pathsTried: jsonPaths });
  }
});
