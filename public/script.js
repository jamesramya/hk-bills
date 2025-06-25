class ReceiptProcessor {
    constructor() {
        this.templates = {};
        this.initializeEventListeners();
        this.loadTemplates();
    }

    initializeEventListeners() {
        const form = document.getElementById('receiptForm');
        const receiptTypeSelect = document.getElementById('receiptType');
        const fileInput = document.getElementById('imageFile');
        const copyBtn = document.getElementById('copyBtn');

        form.addEventListener('submit', this.handleFormSubmit.bind(this));
        receiptTypeSelect.addEventListener('change', this.handleReceiptTypeChange.bind(this));
        fileInput.addEventListener('change', this.handleFileChange.bind(this));
        copyBtn.addEventListener('click', this.copyJsonOutput.bind(this));

        // Drag and drop functionality
        const fileInputContainer = document.querySelector('.file-input-container');
        fileInputContainer.addEventListener('dragover', this.handleDragOver.bind(this));
        fileInputContainer.addEventListener('drop', this.handleDrop.bind(this));
    }

    async loadTemplates() {
        try {
            const response = await fetch('/api/receipts/types');
            const data = await response.json();
            
            if (data.success) {
                this.templates = data.data.templates;
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
    }

    handleReceiptTypeChange(event) {
        const selectedType = event.target.value;
        const templateContainer = document.getElementById('jsonTemplate');
        
        if (selectedType && this.templates[selectedType]) {
            templateContainer.textContent = JSON.stringify(this.templates[selectedType], null, 2);
        } else {
            templateContainer.textContent = 'Select a receipt type to see the expected format';
        }
    }

    handleFileChange(event) {
        const file = event.target.files[0];
        if (file) {
            this.updateFileLabel(file.name);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.style.borderColor = '#3498db';
        event.currentTarget.style.backgroundColor = '#e3f2fd';
    }

    handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const fileInput = document.getElementById('imageFile');
        const files = event.dataTransfer.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            this.updateFileLabel(files[0].name);
        }
        
        event.currentTarget.style.borderColor = '#bdc3c7';
        event.currentTarget.style.backgroundColor = '#f8f9fa';
    }

    updateFileLabel(fileName) {
        const label = document.getElementById('file-label-text');
        label.textContent = fileName;
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData();
        const receiptType = document.getElementById('receiptType').value;
        const imageFile = document.getElementById('imageFile').files[0];
        
        if (!receiptType || !imageFile) {
            this.showError('Please select a receipt type and upload an image');
            return;
        }

        formData.append('receiptType', receiptType);
        formData.append('image', imageFile);

        this.showLoading();
        this.hideError();
        this.hideResults();

        try {
            const response = await fetch('/api/receipts/process', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showResults(result.data, imageFile);
                this.showSuccess('Receipt processed successfully!');
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Network error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    showResults(data, imageFile) {
        const resultsSection = document.getElementById('resultsSection');
        const previewImage = document.getElementById('previewImage');
        const jsonOutput = document.getElementById('jsonOutput');

        // Show uploaded image
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
        };
        reader.readAsDataURL(imageFile);

        // Show JSON output
        jsonOutput.textContent = JSON.stringify(data, null, 2);
        
        resultsSection.style.display = 'grid';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    copyJsonOutput() {
        const jsonOutput = document.getElementById('jsonOutput');
        const text = jsonOutput.textContent;
        
        navigator.clipboard.writeText(text).then(() => {
            const copyBtn = document.getElementById('copyBtn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.backgroundColor = '#27ae60';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.backgroundColor = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('submitBtn').disabled = true;
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('submitBtn').disabled = false;
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.scrollIntoView({ behavior: 'smooth' });
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    showSuccess(message) {
        // Create or update success message
        let successDiv = document.getElementById('successMessage');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'successMessage';
            successDiv.className = 'success-message';
            document.querySelector('.container main').insertBefore(successDiv, document.querySelector('.upload-section'));
        }
        
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 5000);
    }

    hideResults() {
        document.getElementById('resultsSection').style.display = 'none';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReceiptProcessor();
});