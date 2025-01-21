# AI Invoice Creator

A modern web application that uses AI to create professional invoices from natural language input.

## Features

- Natural language processing for item entry
- Voice input support
- Real-time preview of items
- Professional PDF invoice generation
- Business settings customization
- Logo support
- Responsive design

## Setup

1. Install dependencies:
   - The application uses CDN-hosted libraries (no npm/yarn required)
   - Just clone the repository and open `index.html`

2. Configure API Key:
   - Get an OpenAI API key from https://platform.openai.com
   - Replace 'YOUR_OPENAI_API_KEY' in app.js with your actual API key
   - Never commit API keys to version control

3. Configure business settings:
   - Click the gear icon
   - Enter your business details
   - Upload your logo (optional)

4. Usage:
   - Enter items in natural language (e.g., "For John Doe: 2 shirts at $25 each")
   - Use voice input if preferred
   - Preview items in real-time
   - Generate professional PDF invoices

## Technologies Used

- HTML5/CSS3
- JavaScript (ES6+)
- Tailwind CSS
- jsPDF
- OpenAI API
- Web Speech API

## Security Note

Never commit API keys or sensitive credentials to version control. The OpenAI API key should be kept private and secure.

## License

MIT License 