// Add these at the top of your file
let allCompanies = [];
let appliedCompanies = JSON.parse(localStorage.getItem('appliedCompanies')) || [];

// Modify the renderCompanies function
const renderCompanies = () => {
  const searchTerm = searchInput.value.toLowerCase();
  const industryCheckboxes = Array.from(document.querySelectorAll('.industry-filter:checked'));
  
  const selectedIndustries = industryCheckboxes.map(cb => cb.value);
  
  let filtered = allCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm) || 
                         (company.industry && company.industry.toLowerCase().includes(searchTerm));
    
    const matchesIndustry = selectedIndustries.length === 0 || 
                          (company.industry && selectedIndustries.includes(company.industry));
    
    return matchesSearch && matchesIndustry;
  });

  // Sort based on current sort direction
  const sortDirection = document.querySelector('.sort-buttons button.active')?.id === 'sort-desc' ? -1 : 1;
  filtered.sort((a, b) => {
    return a.name.localeCompare(b.name) * sortDirection;
  });

  if (filtered.length === 0) {
    listElement.innerHTML = '<div class="no-results">No companies match your search and filters</div>';
  } else {
    listElement.innerHTML = filtered.map(company => `
      <div class="company-item">
        <input type="checkbox" class="company-checkbox" id="cb-${company.name.replace(/\s+/g, '-')}" 
               ${appliedCompanies.includes(company.name) ? 'checked' : ''}
               data-company="${company.name}">
        <a href="${company.careerUrl}" class="company-link" target="_blank">
          ${company.name} ${company.industry ? `<span class="industry-tag">(${company.industry})</span>` : ''}
        </a>
      </div>
    `).join('');
  }

  // Add event listeners to checkboxes
  document.querySelectorAll('.company-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const companyName = this.dataset.company;
      if (this.checked) {
        if (!appliedCompanies.includes(companyName)) {
          appliedCompanies.push(companyName);
        }
      } else {
        appliedCompanies = appliedCompanies.filter(name => name !== companyName);
      }
      localStorage.setItem('appliedCompanies', JSON.stringify(appliedCompanies));
    });
  });
};

// Add these after your DOMContentLoaded event listener
document.getElementById('sort-asc').addEventListener('click', function() {
  document.getElementById('sort-asc').classList.add('active');
  document.getElementById('sort-desc').classList.remove('active');
  renderCompanies();
});

document.getElementById('sort-desc').addEventListener('click', function() {
  document.getElementById('sort-desc').classList.add('active');
  document.getElementById('sort-asc').classList.remove('active');
  renderCompanies();
});

// Modify the industry filter change handler
document.querySelectorAll('.industry-filter').forEach(cb => {
  cb.addEventListener('change', function() {
    // No longer uncheck "All" when individual boxes are checked
    renderCompanies();
  });
});

// Set default sort to ascending
document.getElementById('sort-asc').classList.add('active');