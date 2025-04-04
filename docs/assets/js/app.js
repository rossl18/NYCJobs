document.addEventListener('DOMContentLoaded', async () => {
  const listElement = document.getElementById('company-list');
  const searchInput = document.getElementById('search-input');
  const filtersContainer = document.getElementById('industry-filters');
  
  if (!listElement || !searchInput || !filtersContainer) {
    showError('Error: Could not find required elements in HTML');
    return;
  }

  try {
    // Try multiple possible JSON paths
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
        console.log(`Trying to load from: ${path}`);
        const response = await fetch(path);
        if (!response.ok) {
          lastError = `HTTP error! Status: ${response.status} for ${path}`;
          continue;
        }
        data = await response.json();
        console.log('Success! Data loaded from:', path, data);
        break;
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!data) {
      throw new Error(`All paths failed. Last error: ${lastError}`);
    }

    // Extract all unique industries
    const industries = [...new Set(data.companies.map(company => company.industry))];
    
    // Create industry filter checkboxes
    filtersContainer.innerHTML = industries.map(industry => `
      <div class="filter-option">
        <input type="checkbox" id="filter-${industry.replace(/\s+/g, '-').toLowerCase()}" 
               class="filter-checkbox" value="${industry}" checked>
        <label for="filter-${industry.replace(/\s+/g, '-').toLowerCase()}" 
               class="filter-label">${industry}</label>
      </div>
    `).join('');

    // Store original data
    let filteredCompanies = [...data.companies];

    // Render companies based on current filters and search
    const renderCompanies = () => {
      const searchTerm = searchInput.value.toLowerCase();
      const selectedIndustries = Array.from(
        document.querySelectorAll('.filter-checkbox:checked')
      ).map(checkbox => checkbox.value);

      filteredCompanies = data.companies.filter(company => {
        const matchesSearch = company.name.toLowerCase().includes(searchTerm) || 
                            (company.industry && company.industry.toLowerCase().includes(searchTerm));
        const matchesIndustry = selectedIndustries.length === 0 || 
                              (company.industry && selectedIndustries.includes(company.industry));
        return matchesSearch && matchesIndustry;
      });

      if (filteredCompanies.length === 0) {
        listElement.innerHTML = '<div class="no-results">No companies match your filters</div>';
      } else {
        listElement.innerHTML = filteredCompanies.map(company => `
          <a href="${company.careerUrl}" 
             class="company-link" 
             target="_blank">
            ${company.name} <span class="industry-tag">(${company.industry})</span>
          </a>
        `).join('');
      }
    };

    // Initial render
    renderCompanies();

    // Add event listeners for filtering
    searchInput.addEventListener('input', renderCompanies);
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', renderCompanies);
    });

  } catch (error) {
    showError(`Failed to load companies: ${error.message}`, 
             'Check the browser console (F12) for details');
    console.error('Debug info:', {
      error, 
      windowLocation: window.location.href,
      pathsTried: jsonPaths
    });
  }
});

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
