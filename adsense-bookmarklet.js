javascript:(function(){
    // Verifică dacă suntem pe pagina admin
    if (!window.location.href.includes('/admin')) {
        alert('Acest bookmarklet funcționează doar pe pagina admin!');
        return;
    }
    
    // Verifică dacă secțiunea AdSense există deja
    if (document.getElementById('adsense-admin-section')) {
        alert('Secțiunea AdSense există deja!');
        return;
    }
    
    // Găsește containerul principal
    const container = document.querySelector('.bg-white.dark\\:bg-gray-800.rounded-lg.shadow-xl') || 
                     document.querySelector('main') || 
                     document.body;
    
    if (!container) {
        alert('Nu s-a găsit containerul pentru AdSense!');
        return;
    }
    
    // Creează secțiunea AdSense
    const adsenseDiv = document.createElement('div');
    adsenseDiv.id = 'adsense-admin-section';
    adsenseDiv.style.cssText = 'margin-top: 20px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;';
    
    adsenseDiv.innerHTML = `
        <div style="margin-bottom: 20px; padding: 16px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
            <h3 style="margin: 0 0 8px 0; color: #1e40af; font-size: 18px; font-weight: 600;">
                🎯 Configurare Google AdSense Publisher ID
            </h3>
            <p style="margin: 0; color: #1d4ed8; font-size: 14px;">
                Gestionează Publisher ID-ul pentru Google AdSense. Cheia curentă: <strong id="current-publisher-id">ca-pub-2305349540791838</strong>
            </p>
        </div>
        
        <div style="padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h4 style="margin: 0 0 16px 0; color: #374151; font-size: 16px; font-weight: 500;">
                Modificare Publisher ID
            </h4>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; color: #374151; font-size: 14px; font-weight: 500;">
                    Noul Publisher ID
                </label>
                <input
                    type="text"
                    id="new-publisher-id"
                    placeholder="ca-pub-2305349540791838"
                    style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace; font-size: 14px; box-sizing: border-box;"
                />
                <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">
                    Găsiți Publisher ID-ul în: <a href="https://www.google.com/adsense/" target="_blank" style="color: #2563eb; text-decoration: underline;">Google AdSense Dashboard</a>
                </p>
            </div>
            
            <div id="validation-status" style="display: none; margin-bottom: 16px; padding: 12px; border-radius: 6px;"></div>
            
            <div style="display: flex; gap: 12px;">
                <button
                    id="test-publisher-id"
                    style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
                    onmouseover="this.style.background='#1d4ed8'"
                    onmouseout="this.style.background='#2563eb'"
                >
                    Testează Format
                </button>
                
                <button
                    id="save-publisher-id"
                    style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;"
                    onmouseover="this.style.background='#047857'"
                    onmouseout="this.style.background='#059669'"
                >
                    <span id="save-button-text">Salvează Publisher ID</span>
                </button>
            </div>
        </div>
        
        <div style="margin-top: 20px; padding: 16px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 500;">
                📊 Informații AdSense
            </h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
                <div>
                    <h5 style="margin: 0 0 8px 0; color: #374151; font-weight: 500;">Format</h5>
                    <ul style="margin: 0; padding-left: 16px; color: #6b7280;">
                        <li>Format: ca-pub-xxxxxxxxxxxxxxxx</li>
                        <li>Lungime: 16 cifre după "ca-pub-"</li>
                        <li>Exemplu: ca-pub-2305349540791838</li>
                    </ul>
                </div>
                
                <div>
                    <h5 style="margin: 0 0 8px 0; color: #374151; font-weight: 500;">Zone Active pe anyway.ro</h5>
                    <ul style="margin: 0; padding-left: 16px; color: #6b7280;">
                        <li>Header Banner (728x90)</li>
                        <li>Footer Banner (970x90)</li>
                        <li>Sidebar Banners (300x250)</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    // Adaugă secțiunea în pagină
    container.appendChild(adsenseDiv);
    
    // Adaugă funcționalitatea
    let currentPublisherId = localStorage.getItem('adsense_publisher_id') || 'ca-pub-2305349540791838';
    
    // Actualizează Publisher ID-ul afișat
    const currentIdElement = document.getElementById('current-publisher-id');
    if (currentIdElement) {
        currentIdElement.textContent = currentPublisherId;
    }
    
    // Validează Publisher ID
    function validatePublisherId(id) {
        const regex = /^ca-pub-\\d{16}$/;
        return regex.test(id);
    }
    
    // Afișează status
    function showStatus(message, isValid) {
        const statusDiv = document.getElementById('validation-status');
        if (!statusDiv) return;
        
        const bgColor = isValid ? '#dcfce7' : '#fef2f2';
        const borderColor = isValid ? '#bbf7d0' : '#fecaca';
        const textColor = isValid ? '#166534' : '#dc2626';
        const icon = isValid ? '✅' : '❌';
        
        statusDiv.style.cssText = `display: block; margin-bottom: 16px; padding: 12px; border-radius: 6px; background: ${bgColor}; border: 1px solid ${borderColor}; color: ${textColor};`;
        statusDiv.innerHTML = `<span>${icon} ${message}</span>`;
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
    
    // Event listener pentru testare
    document.getElementById('test-publisher-id').addEventListener('click', function() {
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
    
    // Event listener pentru salvare
    document.getElementById('save-publisher-id').addEventListener('click', function() {
        const input = document.getElementById('new-publisher-id');
        const publisherId = input ? input.value.trim() : '';
        const saveButtonText = document.getElementById('save-button-text');
        
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
        this.disabled = true;
        
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
            
            showStatus('Publisher ID salvat cu succes în localStorage!', true);
            
            // Resetează butonul
            saveButtonText.textContent = 'Salvează Publisher ID';
            this.disabled = false;
            
            console.log('✅ Publisher ID salvat:', publisherId);
        }, 1000);
    });
    
    alert('✅ Secțiunea AdSense a fost adăugată cu succes!\\n\\nPoți modifica Publisher ID-ul și îl va salva în localStorage.');
})();