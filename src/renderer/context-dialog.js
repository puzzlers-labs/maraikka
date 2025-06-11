let currentAction = null;
let currentFilePath = null;

// Listen for context action from main process
window.electronAPI.onContextAction((data) => {
    currentAction = data.action;
    currentFilePath = data.filePath;
    
    updateDialogContent();
});

function updateDialogContent() {
    const dialogTitle = document.getElementById('dialogTitle');
    const dialogDescription = document.getElementById('dialogDescription');
    const filePath = document.getElementById('filePath');
    const proceedBtn = document.getElementById('proceedBtn');
    
    if (currentAction === 'encrypt') {
        dialogTitle.textContent = 'Encrypt File';
        dialogDescription.textContent = 'Enter a password to encrypt this file:';
        proceedBtn.textContent = 'Encrypt';
        proceedBtn.className = 'btn btn-primary';
    } else if (currentAction === 'decrypt') {
        dialogTitle.textContent = 'Decrypt File';
        dialogDescription.textContent = 'Enter the password to decrypt this file:';
        proceedBtn.textContent = 'Decrypt';
        proceedBtn.className = 'btn btn-success';
    }
    
    if (currentFilePath) {
        // Show just the filename for readability
        const fileName = currentFilePath.split('/').pop();
        filePath.textContent = fileName;
    }
}

// Handle form submission
document.getElementById('contextForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('passwordInput').value;
    if (!password) {
        alert('Please enter a password');
        return;
    }
    
    const proceedBtn = document.getElementById('proceedBtn');
    proceedBtn.disabled = true;
    proceedBtn.textContent = currentAction === 'encrypt' ? 'Encrypting...' : 'Decrypting...';
    
    try {
        let result;
        if (currentAction === 'encrypt') {
            result = await window.electronAPI.encryptFile(currentFilePath, password);
        } else if (currentAction === 'decrypt') {
            result = await window.electronAPI.decryptFile(currentFilePath, password);
        }
        
        if (result.success) {
            // Show success message briefly then close
            proceedBtn.textContent = 'Success!';
            proceedBtn.className = 'btn btn-success';
            setTimeout(() => {
                window.close();
            }, 1500);
        } else {
            throw new Error(result.error || 'Operation failed');
        }
    } catch (error) {
        console.error('Context action error:', error);
        alert(`Error: ${error.message}`);
        
        // Reset button
        proceedBtn.disabled = false;
        proceedBtn.textContent = currentAction === 'encrypt' ? 'Encrypt' : 'Decrypt';
        proceedBtn.className = currentAction === 'encrypt' ? 'btn btn-primary' : 'btn btn-success';
    }
});

// Handle cancel button
document.getElementById('cancelBtn').addEventListener('click', () => {
    window.close();
});

// Handle escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.close();
    }
});

// Focus password input when dialog loads
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('passwordInput').focus();
}); 