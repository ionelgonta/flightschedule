// Script pentru adăugarea funcționalității AdSense în pagina admin existentă
(function() {
    'use strict';
    
    // Așteaptă ca pagina să se încarce
    function waitForElement(selector, callback) {
        const element = document.querySelector(selector);
        if (element) {
            callback(element);
        } else {
            setTimeout(() => waitForElement(selector, callback), 100);
        }
    }
    
    // Funcția principală pentru adăugarea secțiunii AdSense
    function addAdSenseSection() {
        // Găsește containerul principal din pagina admin
        const adminContainer = document.querySelector('.min-h-screen.bg-gradient-to-br') || 
                              document.querySelector('.bg-white.dark\\:bg-gray-800.rounded-lg.shadow-xl') ||
                              document.querySelector('main');
        
        if (!adminContainer) {
            console.log('Nu s-a găsit containerul admin');
            return;
        }
        
        // Creează secțiunea AdSense
        const adsenseSection = document.createElement('div');
        adsenseSection.id = 'adsense-admin-section';
        adsenseSection.className = 'mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700';
        
        adsenseSection.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div class="flex items-center mb-2">
                        <svg class="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100">
                            🎯 Configurare Google AdSense Publisher ID
                        </h3>
                    </div>
                    <p class="text-blue-700 dark:text-blue-300 text-sm">
                        Gestionează Publisher ID-ul pentru Google AdSense. Cheia curentă: <strong id="current-publisher-id">ca-pub-2305349540791838</strong>
                    </p>
                </div>

                <!-- Modificare Publisher ID -->
                <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                    <h4 class="font-medium text-gray-900 dark:text-white mb-4">
                        Modificare Publisher ID
                    </h4>
                    
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
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Găsiți Publisher ID-ul în: <a href="https://www.google.com/adsense/" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">Google AdSense Dashboard</a>
                            </p>
                        </div>

                        <!-- Status Validare -->
                        <div id="validation-status" class="hidden"></div>

                        <!-- Butoane -->
                        <div class="flex space-x-3">
                            <button
                                id="test-publisher-id"
                                class="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                </svg>
                                Testează Format
                            </button>
                            
                            <button
                                id="save-publisher-id"
                                class="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
                                </svg>
                                <span id="save-button-text">Salvează Publisher ID</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Informații -->
                <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 dark:text-white mb-3">
                        📊 Informații AdSense
                    </h4>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h5 class="font-medium text-gray-900 dark:text-white mb-2">Format</h5>
                            <ul class="space-y-1 text-gray-600 dark:text-gray-400">
                                <li>• Format: ca-pub-xxxxxxxxxxxxxxxx</li>
                                <li>• Lungime: 16 cifre după "ca-pub-"</li>
                                <li>• Exemplu: ca-pub-2305349540791838</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h5 class="font-medium text-gray-900 dark:text-white mb-2">Zone Active pe anyway.ro</h5>
                            <ul class="space-y-1 text-gray-600 dark:text-gray-400">
                                <li>• Header Banner (728x90)</li>
                                <li>• Footer Banner (970x90)</li>
                                <li>• Sidebar Banners (300x250)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adaugă secțiunea în pagină
        adminContainer.appendChild(adsenseSection);
        
        // Adaugă funcționalitatea
        addAdSenseFunctionality();
        
        console.log('✅ Secțiunea AdSense a fost adăugată cu succes!');
    }
    
    // Adaugă funcționalitatea JavaScript
    function addAdSenseFunctionality() {
        let currentPublisherId = localStorage.getItem('adsense_publisher_id') || 'ca-pub-2305349540791838';
        
        // Actualizează Publisher ID-ul afișat
        const currentIdElement = document.getElementById('current-publisher-id');
        if (currentIdElement) {
            currentIdElement.textContent = currentPublisherId;
        }
        
        // Validează Publisher ID
        function validatePublisherId(id) {
            const regex = /^ca-pub-\d{16}$/;
            return regex.test(id);
        }
        
        // Afișează status
        function showStatus(message, isValid) {
            const statusDiv = document.getElementById('validation-status');
            if (!statusDiv) return;
            
            const bgColor = isValid ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400';
            const icon = isValid ? '✅' : '❌';
            
            statusDiv.className = `p-3 rounded-lg border ${bgColor}`;
            statusDiv.innerHTML = `
                <div class="flex items-center">
                    <span class="mr-2">${icon}</span>
                    <span class="text-sm">${message}</span>
                </div>
            `;
            statusDiv.classList.remove('hidden');
            
            setTimeout(() => {
                statusDiv.classList.add('hidden');
            }, 5000);
        }
        
        // Event listener pentru testare
        const testButton = document.getElementById('test-publisher-id');
        if (testButton) {
            testButton.addEventListener('click', function() {
                const input = document.getElementById('new-publisher-id');
                const publisherId = input ? input.value.trim() : '';
                
                if (!publisherId) {
                    showStatus('Introduceți un Publisher ID', false);
                    return;
                }
                
                const isValid = validatePublisherId(publisherId);
                if (isValid) {
                    showStatus('Publisher ID valid!', true);
                } else {
                    showStatus('Format invalid. Exemplu: ca-pub-1234567890123456', false);
                }
            });
        }
        
        // Event listener pentru salvare
        const saveButton = document.getElementById('save-publisher-id');
        const saveButtonText = document.getElementById('save-button-text');
        
        if (saveButton && saveButtonText) {
            saveButton.addEventListener('click', function() {
                const input = document.getElementById('new-publisher-id');
                const publisherId = input ? input.value.trim() : '';
                
                if (!publisherId) {
                    showStatus('Introduceți un Publisher ID', false);
                    return;
                }
                
                if (!validatePublisherId(publisherId)) {
                    showStatus('Format Publisher ID invalid', false);
                    return;
                }
                
                // Simulează salvarea
                saveButtonText.textContent = 'Salvez...';
                saveButton.disabled = true;
                
                setTimeout(() => {
                    // Actualizează Publisher ID-ul curent
                    currentPublisherId = publisherId;
                    localStorage.setItem('adsense_publisher_id', publisherId);
                    
                    // Actualizează afișajul
                    if (currentIdElement) {
                        currentIdElement.textContent = publisherId;
                    }
                    
                    // Resetează formularul
                    if (input) {
                        input.value = '';
                    }
                    
                    showStatus('Publisher ID salvat cu succes!', true);
                    
                    // Resetează butonul
                    saveButtonText.textContent = 'Salvează Publisher ID';
                    saveButton.disabled = false;
                    
                    console.log('✅ Publisher ID salvat:', publisherId);
                }, 1000);
            });
        }
    }
    
    // Pornește procesul când pagina se încarcă
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(addAdSenseSection, 2000); // Așteaptă 2 secunde pentru a fi sigur că pagina s-a încărcat
        });
    } else {
        setTimeout(addAdSenseSection, 2000);
    }
    
    console.log('🎯 Script AdSense Admin încărcat!');
})();