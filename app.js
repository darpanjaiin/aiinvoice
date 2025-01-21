// DOM Elements
const appSection = document.getElementById('app-section');
const settingsBtn = document.getElementById('settingsBtn');
const voiceInputBtn = document.getElementById('voiceInputBtn');
const generateInvoiceBtn = document.getElementById('generateInvoiceBtn');
const invoiceForm = document.getElementById('invoiceForm');
const settingsPanel = document.getElementById('settingsPanel');
const addItemBtn = document.getElementById('addItemBtn');
const itemsList = document.getElementById('itemsList');
const businessLogoInput = document.getElementById('businessLogo');
const processTextBtn = document.getElementById('processTextBtn');
const startVoiceBtn = document.getElementById('startVoiceBtn');
const naturalLanguageInput = document.getElementById('naturalLanguageInput');
const itemsPreview = document.getElementById('itemsPreview');

// State Management
let businessSettings = null;
let currentItems = [];
let recognition = null;
let customerName = 'Guest';

// Update Items Preview - Define this function early
function updateItemsPreview() {
    const previewDiv = document.getElementById('itemsPreview');
    if (!previewDiv) return;

    previewDiv.innerHTML = '';
    let total = 0;

    currentItems.forEach((item, index) => {
        const itemTotal = item.quantity * item.price;
        total += itemTotal;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'preview-item';
        itemDiv.innerHTML = `
            <div class="flex-1">
                <span class="font-medium">${item.name}</span>
                <span class="text-gray-600 ml-2">x${item.quantity}</span>
                <span class="text-gray-600 ml-2">@₹${item.price}</span>
            </div>
            <div class="flex items-center">
                <span class="font-medium mr-4">₹${itemTotal.toFixed(2)}</span>
                <button onclick="removeItem(${index})" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        previewDiv.appendChild(itemDiv);
    });

    if (currentItems.length > 0) {
        const totalDiv = document.createElement('div');
        totalDiv.className = 'preview-item font-bold mt-4';
        totalDiv.innerHTML = `
            <div>Total</div>
            <div>₹${total.toFixed(2)}</div>
        `;
        previewDiv.appendChild(totalDiv);
    } else {
        previewDiv.innerHTML = '<p class="text-gray-500">No items added yet</p>';
    }
}

// Make removeItem function globally accessible
window.removeItem = function(index) {
    currentItems.splice(index, 1);
    updateItemsPreview();
};

// OpenAI API Key - Replace with your key after cloning
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';  // Never commit actual API keys to GitHub

// Initialize Speech Recognition
if (window.webkitSpeechRecognition) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        naturalLanguageInput.value = transcript;
        processNaturalLanguageInput(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        alert('Error occurred in recognition: ' + event.error);
        if (startVoiceBtn) {
            startVoiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
        }
    };

    recognition.onend = () => {
        if (startVoiceBtn) {
            startVoiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
        }
    };
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // Process Text Button
    if (processTextBtn) {
        processTextBtn.onclick = async function() {
            console.log('Process text button clicked');
            const input = naturalLanguageInput.value.trim();
            if (!input) {
                alert('Please enter some text to process');
                return;
            }
            await processNaturalLanguageInput(input);
        };
    }

    // Settings Button
    if (settingsBtn) {
        settingsBtn.onclick = function() {
            console.log('Settings button clicked');
            if (settingsPanel) {
                settingsPanel.classList.toggle('hidden');
            }
        };
    }

    // Voice Input Button
    if (startVoiceBtn) {
        startVoiceBtn.onclick = function() {
            console.log('Voice button clicked');
            startVoiceRecognition();
        };
    }

    // Generate Invoice Button
    if (generateInvoiceBtn) {
        generateInvoiceBtn.onclick = function() {
            console.log('Generate invoice button clicked');
            if (currentItems.length === 0) {
                alert('Please add some items first');
                return;
            }
            generateInvoice(customerName, currentItems);
        };
    }

    // Settings Form
    const businessSettingsForm = document.getElementById('businessSettingsForm');
    if (businessSettingsForm) {
        businessSettingsForm.onsubmit = function(e) {
            e.preventDefault();
            handleSettingsSave(e);
        };
    }

    // Load business settings
    loadBusinessSettings();
});

// Process Natural Language Input
async function processNaturalLanguageInput(input) {
    try {
        console.log('Processing input:', input);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo-1106",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that extracts customer name and item details from text. Return only valid JSON."
                    },
                    {
                        role: "user",
                        content: `Extract customer name and items from this text and return a JSON object with format: {"customerName": "name", "items": [{"name": "item", "quantity": number, "price": number}]}. Text: ${input}`
                    }
                ],
                response_format: { "type": "json_object" },
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();
        console.log('API Response:', data);

        const result = JSON.parse(data.choices[0].message.content);
        if (!result.items || !Array.isArray(result.items)) {
            throw new Error('Invalid response format from AI');
        }

        // Update current items and preview
        currentItems = result.items;
        customerName = result.customerName || 'Guest';
        updateItemsPreview();
        naturalLanguageInput.value = '';
    } catch (error) {
        console.error('Error processing input:', error);
        alert('Error: ' + (error.message || 'Failed to process input. Please try again.'));
    }
}

// Business Settings Functions
function loadBusinessSettings() {
    const saved = localStorage.getItem('businessSettings');
    if (saved) {
        businessSettings = JSON.parse(saved);
        populateSettingsForm();
    }
}

function populateSettingsForm() {
    if (!businessSettings) return;

    const form = document.getElementById('businessSettingsForm');
    form.businessName.value = businessSettings.businessName || '';
    form.businessAddress.value = businessSettings.businessAddress || '';
    form.phone.value = businessSettings.phone || '';
    form.email.value = businessSettings.email || '';
    
    if (businessSettings.logo) {
        showLogoPreview(businessSettings.logo);
    }
}

function handleSettingsSave(e) {
    e.preventDefault();
    const form = e.target;
    const logoInput = form.querySelector('#businessLogo');
    
    if (logoInput.files && logoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            businessSettings = {
                businessName: form.businessName.value,
                businessAddress: form.businessAddress.value,
                phone: form.phone.value,
                email: form.email.value,
                logo: e.target.result
            };
            localStorage.setItem('businessSettings', JSON.stringify(businessSettings));
            alert('Settings saved successfully!');
            settingsPanel.classList.add('hidden');
        };
        reader.readAsDataURL(logoInput.files[0]);
    } else {
        businessSettings = {
            businessName: form.businessName.value,
            businessAddress: form.businessAddress.value,
            phone: form.phone.value,
            email: form.email.value,
            logo: businessSettings?.logo
        };
        localStorage.setItem('businessSettings', JSON.stringify(businessSettings));
        alert('Settings saved successfully!');
        settingsPanel.classList.add('hidden');
    }
}

// Invoice Functions
function addItemRow() {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <input type="text" placeholder="Item name" required>
        <input type="number" placeholder="Quantity" required>
        <input type="number" placeholder="Price" required>
        <button type="button" class="remove-item"><i class="fas fa-times"></i></button>
    `;

    row.querySelector('.remove-item').addEventListener('click', () => row.remove());
    itemsList.appendChild(row);
}

function handleInvoiceSubmit(e) {
    e.preventDefault();
    const customerName = document.getElementById('customerName').value;
    const items = [];
    const rows = itemsList.querySelectorAll('.item-row');

    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        items.push({
            name: inputs[0].value,
            quantity: parseFloat(inputs[1].value),
            price: parseFloat(inputs[2].value)
        });
    });

    generateInvoice(customerName, items);
}

function generateInvoice(customerName, items) {
    if (!businessSettings) {
        alert('Please configure business settings first!');
        return;
    }

    if (!items || items.length === 0) {
        alert('Please add at least one item to the invoice');
        return;
    }

    try {
        // Create new document
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Set initial position and constants
        const margin = 20;
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        let y = margin;

        // Professional header with darker blue
        const headerHeight = 45;
        doc.setFillColor(14, 36, 85);
        doc.rect(0, 0, pageWidth, headerHeight, 'F');

        // Add logo if exists
        if (businessSettings.logo) {
            try {
                doc.setFillColor(255, 255, 255);
                doc.roundedRect(margin - 2, 8, 32, 19, 2, 2, 'F');
                doc.addImage(businessSettings.logo, 'PNG', margin, 9, 28, 17);
            } catch (logoError) {
                console.error('Logo error:', logoError);
            }
        }

        // Company details
        const rightAlign = pageWidth - margin;
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        
        // Business name and details
        if (businessSettings.businessName) {
            doc.text(businessSettings.businessName, rightAlign, 15, { align: 'right' });
        }
        
        let detailsY = 20;
        if (businessSettings.businessAddress) {
            const addressLines = doc.splitTextToSize(businessSettings.businessAddress, 90);
            addressLines.forEach(line => {
                doc.text(line, rightAlign, detailsY, { align: 'right' });
                detailsY += 5;
            });
        }

        if (businessSettings.phone) {
            doc.text(`Tel: ${businessSettings.phone}`, rightAlign, detailsY, { align: 'right' });
            detailsY += 5;
        }
        
        if (businessSettings.email) {
            doc.text(`Email: ${businessSettings.email}`, rightAlign, detailsY, { align: 'right' });
        }

        // Invoice title
        y = headerHeight + 15;
        doc.setTextColor(14, 36, 85);
        doc.setFontSize(18);
        doc.text('INVOICE', margin, y);

        // Invoice details
        const today = new Date();
        const invoiceNumber = `INV${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        
        y += 10;
        doc.setFontSize(9);
        doc.text('Invoice No:', margin, y);
        doc.text(invoiceNumber, margin + 20, y);
        
        y += 6;
        doc.text('Date:', margin, y);
        doc.text(today.toLocaleDateString(), margin + 20, y);

        // Bill To section
        y += 10;
        doc.setFontSize(9);
        doc.text('BILL TO:', margin, y);
        y += 6;
        doc.text(customerName || 'Guest', margin + 20, y);

        // Items table
        y += 10;
        const headers = [['Item', 'Qty', 'Rate', 'Amount']];
        const data = items.map(item => [
            item.name,
            item.quantity.toString(),
            item.price.toFixed(2),
            (item.quantity * item.price).toFixed(2)
        ]);

        doc.autoTable({
            head: headers,
            body: data,
            startY: y,
            margin: { left: margin },
            theme: 'grid',
            headStyles: {
                fillColor: [14, 36, 85],
                textColor: [255, 255, 255],
                fontSize: 9
            },
            styles: {
                fontSize: 9,
                cellPadding: 3
            },
            columnStyles: {
                0: { cellWidth: 90 },
                1: { cellWidth: 20, halign: 'right' },
                2: { cellWidth: 30, halign: 'right' },
                3: { cellWidth: 30, halign: 'right' }
            }
        });

        // Calculate total
        const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        
        // Add total
        y = doc.lastAutoTable.finalY + 5;
        doc.setFontSize(9);
        doc.text('Total:', pageWidth - margin - 40, y);
        doc.text(total.toFixed(2), pageWidth - margin, y, { align: 'right' });

        // Amount in words
        y += 8;
        doc.setFontSize(8);
        const amountInWords = numberToWords(total);
        doc.text(`Amount in words: ${amountInWords}`, margin, y);

        // Save the PDF
        doc.save(`Invoice_${invoiceNumber}.pdf`);
        return true;
    } catch (error) {
        console.error('Error generating invoice:', error);
        alert('Error generating invoice. Please try again.');
        return false;
    }
}

// Helper function to convert number to words
function numberToWords(number) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    function convertLessThanThousand(n) {
        if (n === 0) return '';
        
        if (n < 10) return ones[n];
        
        if (n < 20) return teens[n - 10];
        
        if (n < 100) {
            return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        }
        
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertLessThanThousand(n % 100) : '');
    }

    let num = Math.floor(number);
    const decimal = Math.round((number - num) * 100);
    
    if (num === 0) return 'Zero Rupees';
    
    let words = '';
    
    if (num >= 100000) {
        words += convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh ';
        num = num % 100000;
    }
    
    if (num >= 1000) {
        words += convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand ';
        num = num % 1000;
    }
    
    words += convertLessThanThousand(num);
    
    words = words.trim() + ' Rupees';
    
    if (decimal > 0) {
        words += ' and ' + convertLessThanThousand(decimal) + ' Paise';
    }
    
    return words;
}

// Voice Input Functions
function startVoiceRecognition() {
    if (!recognition) {
        alert('Speech recognition is not supported in your browser.');
        return;
    }

    try {
        if (recognition.state === 'running') {
            recognition.stop();
            startVoiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
        } else {
            recognition.start();
            startVoiceBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
        }
    } catch (error) {
        console.error('Error with voice recognition:', error);
        recognition.stop();
        startVoiceBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice Input';
        alert('Error with voice recognition. Please try again.');
    }
}

// Logo Preview
function showLogoPreview(logoData) {
    const previewContainer = document.createElement('div');
    previewContainer.className = 'logo-preview mt-2';
    
    const img = document.createElement('img');
    img.src = logoData;
    img.style.maxWidth = '100px';
    img.style.maxHeight = '50px';
    previewContainer.appendChild(img);
    
    const existingPreview = document.querySelector('.logo-preview');
    if (existingPreview) {
        existingPreview.remove();
    }
    businessLogoInput.parentNode.appendChild(previewContainer);
}

function showApp() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
} 