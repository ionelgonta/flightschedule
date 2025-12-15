// Patch pentru adăugarea funcționalității AdSense în pagina admin existentă
// Acest script va fi adăugat la sfârșitul paginii admin

// Adaugă tab AdSense
const addAdSenseTab = () => {
  // Găsește containerul de tab-uri
  const tabContainer = document.querySelector('nav.flex.space-x-8');
  if (!tabContainer) return;

  // Creează tab-ul AdSense
  const adsenseTab = document.createElement('button');
  adsenseTab.className = 'py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300';
  adsenseTab.innerHTML = `
    <svg class="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
    </svg>
    Google AdSense
  `;

  // Adaugă tab-ul la început
  tabContainer.insertBefore(adsenseTab, tabContainer.firstChild);

  // Adaugă event listener
  adsenseTab.addEventListener('click', showAdSensePanel);
};

// Afișează panelul AdSense
const showAdSensePanel = () => {
  // Găsește containerul de conținut
  const contentContainer = document.querySelector('.p-6');
  if (!contentContainer) return;

  // Creează conținutul AdSense
  const adsenseContent = `
    <div class="space-y-6">
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          🎯 Configurare Google AdSense Publisher ID
        </h3>
        <p class="text-blue-700 dark:text-blue-300 text-sm">
          Gestionează Publisher ID-ul pentru Google AdSense. Cheia curentă: <strong id="current-publisher-id">Încărcare...</strong>
        </p>
      </div>

      <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
        <h5 class="font-medium text-gray-900 dark:text-white mb-4">
          Actualizare Publisher ID
        </h5>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Noul Publisher ID
            </label>
            <input
              type="text"
              id="new-publisher-id"
              placeholder="ca-pub-2305349540791838"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
            />
          </div>

          <div id="adsense-status" class="hidden"></div>

          <div class="flex space-x-3">
            <button
              id="test-publisher-id"
              class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Testează Publisher ID
            </button>
            
            <button
              id="save-publisher-id"
              class="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Salvează Publisher ID
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Înlocuiește conținutul
  contentContainer.innerHTML = adsenseContent;

  // Adaugă event listeners
  document.getElementById('test-publisher-id').addEventListener('click', testPublisherId);
  document.getElementById('save-publisher-id').addEventListener('click', savePublisherId);

  // Încarcă Publisher ID curent
  loadCurrentPublisherId();
};

// Încarcă Publisher ID curent
const loadCurrentPublisherId = async () => {
  try {
    const response = await fetch('/api/admin/adsense');
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('current-publisher-id').textContent = data.publisherId;
    } else {
      document.getElementById('current-publisher-id').textContent = 'Nu este configurat';
    }
  } catch (error) {
    document.getElementById('current-publisher-id').textContent = 'Eroare la încărcare';
  }
};

// Testează Publisher ID
const testPublisherId = async () => {
  const publisherId = document.getElementById('new-publisher-id').value;
  const statusDiv = document.getElementById('adsense-status');
  
  if (!publisherId.trim()) {
    showStatus('Introduceți un Publisher ID', 'error');
    return;
  }

  try {
    const response = await fetch('/api/admin/adsense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publisherId, action: 'test' })
    });

    const data = await response.json();
    
    if (data.success && data.valid) {
      showStatus('Publisher ID valid și funcțional!', 'success');
    } else {
      showStatus(data.error || 'Publisher ID invalid', 'error');
    }
  } catch (error) {
    showStatus('Eroare de conexiune', 'error');
  }
};

// Salvează Publisher ID
const savePublisherId = async () => {
  const publisherId = document.getElementById('new-publisher-id').value;
  
  if (!publisherId.trim()) {
    showStatus('Introduceți un Publisher ID', 'error');
    return;
  }

  try {
    const response = await fetch('/api/admin/adsense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publisherId, action: 'save' })
    });

    const data = await response.json();
    
    if (data.success) {
      showStatus('Publisher ID salvat cu succes!', 'success');
      loadCurrentPublisherId();
    } else {
      showStatus(data.error || 'Eroare la salvare', 'error');
    }
  } catch (error) {
    showStatus('Eroare de conexiune', 'error');
  }
};

// Afișează status
const showStatus = (message, type) => {
  const statusDiv = document.getElementById('adsense-status');
  const bgColor = type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700';
  
  statusDiv.className = `p-3 ${bgColor} border rounded-lg`;
  statusDiv.textContent = message;
  statusDiv.classList.remove('hidden');
  
  setTimeout(() => {
    statusDiv.classList.add('hidden');
  }, 5000);
};

// Inițializează când pagina se încarcă
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(addAdSenseTab, 1000); // Așteaptă ca pagina să se încarce complet
});

console.log('AdSense patch loaded successfully!');