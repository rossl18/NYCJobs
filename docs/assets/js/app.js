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

// Tracking functions
function saveCheckedCompany(companyName, isChecked) {
  const checkedCompanies = JSON.parse(localStorage.getItem('checkedCompanies')) || [];
  const index = checkedCompanies.indexOf(companyName);

  if (isChecked && index === -1) {
    checkedCompanies.push(companyName);
  } else if (!isChecked && index !== -1) {
    checkedCompanies.splice(index, 1);
  }

  localStorage.setItem('checkedCompanies', JSON.stringify(checkedCompanies));
}

function loadCheckedCompanies() {
  return JSON.parse(localStorage.getItem('checkedCompanies')) || [];
}

function resetCheckedCompanies() {
  localStorage.removeItem('checkedCompanies');
  document.querySelectorAll('.company-checkbox').forEach(checkbox => {
    checkbox.checked = false;
    checkbox.closest('.company-item').classList.remove('company-checked');
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const listElement = document.getElementById('company-list');
  const searchInput = document.getElementById('search-input');
  const filtersContainer = document.getElementById('industry-filters');
  const toggleCheckedBtn = document.getElementById('toggle-checked');
  const resetCheckedBtn = document.getElementById('reset-checked');
  
  if (!listElement || !searchInput || !filtersContainer) {
    showError('Error: Could not find required elements in HTML');
    return;
  }

  let showChecked = true;
  let allCompanies = [];

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

    // Remove duplicates and store
    allCompanies = removeDuplicates(data.companies);

    // Get all unique industries
    const industries = [...new Set(allCompanies.map(c => c.industry).filter(Boolean))].sort();
    
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

    // Toggle checked companies visibility
    toggleCheckedBtn.addEventListener('click', () => {
      showChecked = !showChecked;
      toggleCheckedBtn.textContent = showChecked ? 'Hide Checked' : 'Show Checked';
      renderCompanies();
    });

    // Reset all checked companies
    resetCheckedBtn.addEventListener('click', resetCheckedCompanies);

    // Render companies based on filters
    const renderCompanies = () => {
      const searchTerm = searchInput.value.toLowerCase();
      const allCheckbox = document.getElementById('filter-all');
      const industryCheckboxes = Array.from(document.querySelectorAll('.industry-filter:checked'));
      const checkedCompanies = loadCheckedCompanies();
      
      const selectedIndustries = allCheckbox.checked 
        ? []
        : industryCheckboxes.map(cb => cb.value);

      const filtered = allCompanies.filter(company => {
        // Search term matching
        const matchesSearch = company.name.toLowerCase().includes(searchTerm) || 
                            (company.industry && company.industry.toLowerCase().includes(searchTerm));
        
        // Industry matching
        const matchesIndustry = selectedIndustries.length === 0 || 
                              (company.industry && selectedIndustries.includes(company.industry));
        
        // Checked status
        const isChecked = checkedCompanies.includes(company.name);
        const matchesCheckedStatus = showChecked || !isChecked;
        
        return matchesSearch && matchesIndustry && matchesCheckedStatus;
      });

      if (filtered.length === 0) {
        listElement.innerHTML = '<div class="no-results">No companies match your search and filters</div>';
      } else {
        listElement.innerHTML = filtered.map(company => {
          const isChecked = checkedCompanies.includes(company.name);
          return `
            <div class="company-item ${isChecked ? 'company-checked' : ''}">
              <input type="checkbox" class="company-checkbox" 
                     data-company="${company.name}" 
                     ${isChecked ? 'checked' : ''}>
              <a href="${company.careerUrl}" class="company-link" target="_blank">
                ${company.name} ${company.industry ? `<span class="industry-tag">(${company.industry})</span>` : ''}
              </a>
            </div>
          `;
        }).join('');
      }

      // Add event listeners to new checkboxes
      document.querySelectorAll('.company-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
          const companyName = this.dataset.company;
          const isChecked = this.checked;
          saveCheckedCompany(companyName, isChecked);
          this.closest('.company-item').classList.toggle('company-checked', isChecked);
        });
      });
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
