document.addEventListener('DOMContentLoaded', () => {
  fetch('../companies.json')
    .then(response => response.json())
    .then(data => {
      const list = document.getElementById('company-list');
      
      data.companies.forEach(company => {
        const link = document.createElement('a');
        link.href = company.careerUrl;
        link.textContent = company.name;
        link.className = 'company-link';
        link.target = '_blank';
        list.appendChild(link);
      });
    })
    .catch(error => {
      console.error('Error loading data:', error);
      document.getElementById('company-list').innerHTML = 
        '<p>Error loading company data. Please try again later.</p>';
    });
});
