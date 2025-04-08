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

// We'll store the 'visited' state in this object, keyed by "companyKey"
let visitedCompanies = {};

function getCompanyKey(company) {
  // Create a unique key for each company, based on name + URL
  return (
    company.name.toLowerCase().replace(/\s+/g, '_') +
    '|' +
    (company.careerUrl.toLowerCase().replace(/\s+/g, '_') || '')
  );
}

document.addEventListener('DOMContentLoaded', async () => {
  // Load previously visited companies from localStorage, if present
  const storedVisited = localStorage.getItem('visitedCompanies');
  if (storedVisited) {
    visitedCompanies = JSON.parse(storedVisited);
  } else {
    visitedCompanies = {};
  }

  const listElement = document.getElementById('company-list');
  const searchInput = document.getElementById('search-input');
  const filtersContainer = document.getElementById('industry-filters');
  
  if (!listElement || !searchInput || !filtersContainer) {
    showError('Error: Could not find required elements in HTML');
    return;
  }

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
        console.log(`Trying to load from: ${path}`);
        const response = await fetch(path);
        if (!response.ok) {
          lastError = `HTTP error! Status: ${response.status} for ${path}`;
          continue;
        }
        data = await response.json();
        console.log('Success! Data loaded from:', path);
        break;
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!data) {
      throw new Error(`All paths failed. Last error: ${lastError}`);
    }

    // Remove duplicates
    data.companies = removeDuplicates(data.companies);

    // Get all unique industries
    const industries = [...new Set(data.companies.map(c => c.industry).filter(Boolean))].sort();
    
    // Render industry filters
    filtersContainer.innerHTML = `
      <div class="filter-option">
        <input type="checkbox" id="filter-all" class="filter-checkbox" checked>
        <label for="filter-all" class="filter-label">All Industries</label>
      </div>
      ${industries.map(industry => `
        <div class="filter-option">
          <input type="checkbox" id="filter-${industry.toLowerCase().replace(/\s+/g, '-')}" 
                 class="filter-checkbox industry-filter" value="${industry}" checked>
          <label for="filter-${industry.toLowerCase().replace(/\s+/g, '-')}" 
                 class="filter-label">${industry}</label>
        </div>
      `).join('')}
    `;

    // Handle "All" checkbox
    document.getElementById('filter-all').addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('.industry-filter');
      checkboxes.forEach(cb => {
        cb.checked = !this.checked;
      });
      renderCompanies();
    });

    // Handle individual industry checkboxes
    document.querySelectorAll('.industry-filter').forEach(cb => {
      cb.addEventListener('change', function() {
        if (!this.checked) {
          document.getElementById('filter-all').checked = false;
        }
        renderCompanies();
      });
    });

    // Render companies based on filters
    const renderCompanies = () => {
      const searchTerm = searchInput.value.toLowerCase();
      const allCheckbox = document.getElementById('filter-all');
      const industryCheckboxes = Array.from(document.querySelectorAll('.industry-filter:checked'));
      
      const selectedIndustries = allCheckbox.checked 
        ? [] // empty array means "all industries"
        : industryCheckboxes.map(cb => cb.value);

      const filtered = data.companies.filter(company => {
        // Search term matching
        const matchesSearch = company.name.toLowerCase().includes(searchTerm) || 
                            (company.industry && company.industry.toLowerCase().includes(searchTerm));
        
        // Industry matching
        const matchesIndustry = selectedIndustries.length === 0 || 
                              (company.industry && selectedIndustries.includes(company.industry));
        
        return matchesSearch && matchesIndustry;
      });

      if (filtered.length === 0) {
        listElement.innerHTML = '<div class="no-results">No companies match your search and filters</div>';
      } else {
        // Build the HTML with an added checkbox for "visited"
        listElement.innerHTML = filtered.map(company => {
          const cKey = getCompanyKey(company);
          const isChecked = visitedCompanies[cKey] ? 'checked' : '';
          
          return `
            <div class="company-item">
              <input 
                type="checkbox" 
                class="visited-checkbox" 
                data-company-key="${cKey}"
                ${isChecked}
              />
              <a href="${company.careerUrl}" class="company-link" target="_blank">
                ${company.name} ${company.industry ? `<span class="industry-tag">(${company.industry})</span>` : ''}
              </a>
            </div>
          `;
        }).join('');

        // Attach change event for each checkbox to store in localStorage
        document.querySelectorAll('.visited-checkbox').forEach(checkbox => {
          checkbox.addEventListener('change', function() {
            visitedCompanies[this.dataset.companyKey] = this.checked;
            localStorage.setItem('visitedCompanies', JSON.stringify(visitedCompanies));
          });
        });
      }
    };

    // Initial render
    renderCompanies();

    // Search input listener
    searchInput.addEventListener('input', renderCompanies);

  } catch (error) {
    showError(`Failed to load companies: ${error.message}`, 
             'Check the browser console (F12) for details');
    console.error('Debug info:', {
      error, 
      windowLocation: window.location.href,
      jsonPathsTried: jsonPaths
    });
  }
});

