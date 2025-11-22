# DocPilot - OnlyOffice + LLM Application

A powerful web application that integrates OnlyOffice document editor with AI capabilities powered by DeepSeek LLM.

## Features

### 📁 Three-Panel Layout

1. **Left Panel - File List**
   - Browse all documents from OnlyOffice server
   - Click to open and edit documents
   - Support for Word, Excel, PowerPoint, and more
   - Toggle visibility to maximize workspace

2. **Center Panel - Document Editor**
   - Full OnlyOffice document editor
   - Edit Word documents, spreadsheets, presentations
   - Real-time collaboration support
   - Built-in automation API

3. **Right Panel - AI Chat Assistant**
   - Powered by DeepSeek LLM
   - Natural language interaction
   - Agent mode with MCP (Model Context Protocol) support
   - Document automation capabilities

### 🤖 Agent Mode

When MCP configuration is loaded, the assistant can:
- Insert text into documents
- Apply formatting (bold, italic, underline)
- Replace selected text
- Update spreadsheet cells
- Modify presentations

### Commands in Agent Mode

Simply chat naturally with commands like:
- "insert text 'Hello World'"
- "make bold"
- "replace selected text"
- "add formatted paragraph"

## Setup

### Prerequisites

- Node.js 16+ installed
- OnlyOffice Document Server running at `http://192.168.50.156/`
- DeepSeek API key

### Configuration

Edit `config.js`:

```javascript
const config = {
  baseURL: "http://192.168.50.156/",
  llmURL: "https://api.deepseek.com/v1",
  llmAPIKey: "YOUR_API_KEY_HERE",
};
```

### Installation

```bash
# Install dependencies
npm install

# Start the application
npm start
```

The application will open at `http://localhost:3000`

## Usage

### Opening Documents

1. Click on any file in the left panel
2. The document will open in the center editor
3. Edit as needed

### Using the AI Assistant

1. Type your message in the chat input
2. Press Enter or click Send
3. The AI will respond and can help with various tasks

### Enabling Agent Mode

1. Ensure `mcp.json` is in your file list
2. Click "Load MCP" button in the chat panel
3. Agent mode will activate
4. Now you can use document automation commands

### Document Automation Examples

**Insert text:**
```
insert text "This is automated content"
```

**Add bold text:**
```
make bold text
```

**Replace selection:**
```
replace the selected text with something new
```

## Project Structure

```
oa-pilot/
├── App.js                          # Main application
├── App.css                         # Main styles
├── config.js                       # Configuration
├── package.json                    # Dependencies
├── public/
│   ├── index.html
│   └── mcp.json                   # MCP configuration
└── src/
    └── components/
        ├── FileList.js            # File browser component
        ├── FileList.css
        ├── ChatPanel.js           # AI chat component
        └── ChatPanel.css
```

## Technologies

- **React** - UI framework
- **OnlyOffice Document Editor** - Document editing
- **DeepSeek API** - LLM capabilities
- **OnlyOffice Builder API** - Document automation

## API Integration

### OnlyOffice API
- File list: `GET /example/files`
- Download: `GET /example/download?fileName={name}`
- Tracking: `POST /example/track?filename={name}`

### DeepSeek LLM API
- Endpoint: `https://api.deepseek.com/v1/chat/completions`
- Model: `deepseek-chat`
- Authentication: Bearer token

## Development

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Troubleshooting

### Document not loading
- Check OnlyOffice server is running
- Verify `baseURL` in `config.js`
- Check browser console for errors

### Chat not working
- Verify DeepSeek API key is valid
- Check `llmURL` and `llmAPIKey` in `config.js`
- Ensure internet connectivity

### Agent mode not working
- Ensure `mcp.json` exists in file list
- Wait for document to fully load before using agent commands
- Check that document type supports the command (Word for text, Excel for cells)

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
