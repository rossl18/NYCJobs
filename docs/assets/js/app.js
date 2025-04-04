// Load and display companies
fetch('companies.json')
  .then(response => response.json())
  .then(data => {
    const companies = data.companies;
    const table = document.getElementById('company-list');
    
    // Fill table
    companies.forEach(company => {
      const row = table.insertRow();
      row.innerHTML = `
        <td>${company.name}</td>
        <td><a href="${company.careerUrl}" target="_blank">View Jobs</a></td>
      `;
    });
    
    // Add search
    document.getElementById('search').addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const rows = table.querySelectorAll('tr');
      
      rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        row.style.display = name.includes(term) ? '' : 'none';
      });
    });
  });
