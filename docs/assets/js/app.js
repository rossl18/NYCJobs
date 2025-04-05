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

document.addEventListener('DOMContentLoaded', async () => {
  const listElement = document.getElementById('company-list');
  const searchInput = document.getElementById('search-input');
  const filtersContainer = document.getElementById('industry-filters');
  const sortSelect = document.getElementById('sort-select');
  
  if (!listElement || !searchInput || !filtersContainer || !sortSelect) {
    showError('Error: Could not find required elements in HTML');
    return;
  }

  // Load or initialize visited companies from localStorage
  let visitedCompanies = new Set();
  try {
    const savedVisited = localStorage.getItem('visitedCompanies');
    if (savedVisited) {
      visitedCompanies = new Set(JSON.parse(savedVisited));
    }
  } catch (e) {
    console.error("Error loading visited companies from localStorage", e);
  }

  // Function to save visited companies to localStorage
  const saveVisited = () => {
    try {
      localStorage.setItem('visitedCompanies', JSON.stringify([...visitedCompanies]));
    } catch (e) {
      console.error("Error saving to localStorage", e);
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

    // Handle "All" checkbox with improved logic
    document.getElementById('filter-all').addEventListener('change', function() {
      const checkboxes = document.querySelectorAll('.industry-filter');
      const allChecked = this.checked;
      
      checkboxes.forEach(cb => {
        cb.checked = allChecked;
      });
      
      renderCompanies();
    });

    // Handle individual industry checkboxes with improved logic
    document.querySelectorAll('.industry-filter').forEach(cb => {
      cb.addEventListener('change', function() {
        // Check if all industry filters are checked
        const allIndustryFilters = document.querySelectorAll('.industry-filter');
        const allChecked = Array.from(allIndustryFilters).every(checkbox => checkbox.checked);
        const anyChecked = Array.from(allIndustryFilters).some(checkbox => checkbox.checked);
        
        // Update "All" checkbox accordingly
        document.getElementById('filter-all').checked = allChecked;
        
        // If no industry is selected, select all
        if (!anyChecked) {
          document.getElementById('filter-all').checked = true;
          allIndustryFilters.forEach(checkbox => {
            checkbox.checked = true;
          });
        }
        
        renderCompanies();
      });
    });

    // Sort function
    const sortCompanies = (companies, sortMethod) => {
      const sorted = [...companies];
      
      switch(sortMethod) {
        case 'az':
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case 'za':
          return sorted.sort((a, b) => b.name.localeCompare(a.name));
        case 'industry':
          return sorted.sort((a, b) => {
            const industryA = a.industry || '';
            const industryB = b.industry || '';
            return industryA.localeCompare(industryB) || a.name.localeCompare(b.name);
          });
        default:
          return sorted;
      }
    };

    // Handle sort selection
    sortSelect.addEventListener('change', renderCompanies);

    // Render companies based on filters and sort
    const renderCompanies = () => {
      const searchTerm = searchInput.value.toLowerCase();
      const allCheckbox = document.getElementById('filter-all');
      const industryCheckboxes = Array.from(document.querySelectorAll('.industry-filter:checked'));
      const sortMethod = sortSelect.value;
      
      // Get selected industries
      const selectedIndustries = allCheckbox.checked 
        ? industries // If "All" is checked, include all industries
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

      // Sort the filtered companies
      const sortedCompanies = sortCompanies(filtered, sortMethod);

      if (sortedCompanies.length === 0) {
        listElement.innerHTML = '<div class="no-results">No companies match your search and filters</div>';
      } else {
        listElement.innerHTML = sortedCompanies.map(company => {
          const companyId = company.name.toLowerCase().replace(/\s+/g, '-');
          const isVisited = visitedCompanies.has(companyId);
          
          return `
            <div class="company-item">
              <input type="checkbox" id="visited-${companyId}" 
                     class="visited-checkbox" ${isVisited ? 'checked' : ''}>
              <a href="${company.careerUrl}" class="company-link" data-company-id="${companyId}" target="_blank">
                ${company.name} ${company.industry ? `<span class="industry-tag">(${company.industry})</span>` : ''}
              </a>
            </div>
          `;
        }).join('');

        // Add event listeners for visited checkboxes
        document.querySelectorAll('.visited-checkbox').forEach(checkbox => {
          checkbox.addEventListener('change', function() {
            const companyId = this.id.replace('visited-', '');
            
            if (this.checked) {
              visitedCompanies.add(companyId);
            } else {
              visitedCompanies.delete(companyId);
            }
            
            saveVisited();
          });
        });

        // Add event listeners for company links to automatically mark as visited
        document.querySelectorAll('.company-link').forEach(link => {
          link.addEventListener('click', function() {
            const companyId = this.getAttribute('data-company-id');
            const checkbox = document.getElementById(`visited-${companyId}`);
            
            if (checkbox && !checkbox.checked) {
              checkbox.checked = true;
              visitedCompanies.add(companyId);
              saveVisited();
            }
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
      pathsTried: jsonPaths
    });
  }
});
