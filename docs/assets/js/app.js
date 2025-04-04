document.addEventListener('DOMContentLoaded', async () => {
  const listElement = document.getElementById('company-list');
  if (!listElement) {
    showError('Error: Could not find #company-list element in HTML');
    return;
  }

  try {
    // Try BOTH possible JSON paths (GitHub Pages can be tricky)
    const jsonPaths = [
      'companies.json',         // Try 1: Same directory as HTML
      '../companies.json',      // Try 2: One level up
      'docs/companies.json',    // Try 3: Common GitHub Pages path
      'NYCJobs/docs/companies.json' // Try 4: Full path
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

    // Render companies
    listElement.innerHTML = data.companies.map(company => `
      <a href="${company.careerUrl}" 
         class="company-link" 
         target="_blank">
        ${company.name}
      </a>
    `).join('');

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
