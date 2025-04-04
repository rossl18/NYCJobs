document.addEventListener('DOMContentLoaded', function() {
  fetch('data/companies.json')
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById('company-list');
      
      // Simple search functionality
      document.getElementById('search').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = data.companies.filter(company => 
          company.name.toLowerCase().includes(term)
        );
        renderCompanies(filtered);
      });

      // Initial render
      renderCompanies(data.companies);
    });

  function renderCompanies(companies) {
    const container = document.getElementById('company-list');
    container.innerHTML = companies.map(company => `
      <div class="company">
        <strong>${company.name}</strong> - 
        <a href="${company.careerUrl}" target="_blank">Careers</a>
      </div>
    `).join('');
  }
});
