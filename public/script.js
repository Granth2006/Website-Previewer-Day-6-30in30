const urlInput = document.getElementById('url-input');
const previewBtn = document.getElementById('preview-btn');
const iframe = document.getElementById('preview-frame');
const previewWrapper = document.getElementById('preview-wrapper');
const loadingOverlay = document.getElementById('loading-overlay');
const errorOverlay = document.getElementById('error-overlay');
const deviceBtns = document.querySelectorAll('.device-btn');
const captureBtn = document.getElementById('capture-btn');
const pdfBtn = document.getElementById('pdf-btn');
const themeBtn = document.getElementById('theme-btn');
const loadingModal = document.getElementById('loading-modal');
const modalText = document.getElementById('modal-text');
const toastContainer = document.getElementById('toast-container');

let currentDevice = 'desktop';

// Theme Toggle
themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeBtn.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});

// Device Switcher
deviceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        deviceBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentDevice = btn.dataset.device;
        
        previewWrapper.className = `preview-wrapper ${currentDevice}`;
    });
});

// Format and validate URL
function getValidUrl(input) {
    if (!input) return null;
    let url = input.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    try {
        new URL(url);
        return url;
    } catch {
        return null;
    }
}

// Load Preview
previewBtn.addEventListener('click', () => {
    const url = getValidUrl(urlInput.value);
    
    if (!url) {
        showToast('Please enter a valid URL', 'error');
        return;
    }

    // Reset iframe states
    iframe.classList.remove('loaded');
    errorOverlay.classList.remove('active');
    loadingOverlay.classList.add('active');
    
    // Note: Due to X-Frame-Options, many sites won't load in iframe. 
    // Usually, we'd handle CORS here via proxy, but for MVP iframe is requested for visual structure. 
    // Fallback visually if it fails or just show it if it works.
    
    iframe.onload = () => {
        loadingOverlay.classList.remove('active');
        iframe.classList.add('loaded');
    };
    
    iframe.onerror = () => {
        loadingOverlay.classList.remove('active');
        errorOverlay.classList.add('active');
        showToast('Failed to load in iframe due to security policies.', 'error');
    };

    iframe.src = url;
});

// Trigger Screenshot Generation
captureBtn.addEventListener('click', async () => {
    const url = getValidUrl(urlInput.value);
    if (!url) {
        showToast('Please enter a valid URL first.', 'error');
        return;
    }

    showModal('Generating Screenshot...');
    try {
        const response = await fetch('/api/screenshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, device: currentDevice, fullPage: true })
        });
        const data = await response.json();
        
        if (data.success) {
            downloadFile(data.url, `screenshot-${currentDevice}.png`);
            showToast('Screenshot downloaded successfully!', 'success');
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        showToast('Error generating screenshot.', 'error');
        console.error(err);
    } finally {
        hideModal();
    }
});

// Trigger PDF Generation
pdfBtn.addEventListener('click', async () => {
    const url = getValidUrl(urlInput.value);
    if (!url) {
        showToast('Please enter a valid URL first.', 'error');
        return;
    }

    showModal('Generating Full Page PDF...');
    try {
        const response = await fetch('/api/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const data = await response.json();
        
        if (data.success) {
            downloadFile(data.url, 'webpage.pdf');
            showToast('PDF downloaded successfully!', 'success');
        } else {
            throw new Error(data.error);
        }
    } catch (err) {
        showToast('Error generating PDF.', 'error');
        console.error(err);
    } finally {
        hideModal();
    }
});

function showModal(text) {
    modalText.textContent = text;
    loadingModal.classList.add('active');
}

function hideModal() {
    loadingModal.classList.remove('active');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-circle-xmark';
    
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <p>${message}</p>
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger reflow to animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Support hitting Enter in input
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        previewBtn.click();
    }
});
