# Agent Mode Usage Guide

## What is Agent Mode?

Agent Mode enables the AI assistant to directly manipulate OnlyOffice documents using natural language commands. It uses the Model Context Protocol (MCP) to understand available tools and execute document automation tasks.

## Enabling Agent Mode

1. **Upload mcp.json**: Ensure `mcp.json` is available in your OnlyOffice server's file list
2. **Click "Load MCP"**: In the chat panel, click the "Load MCP" button
3. **Wait for confirmation**: You'll see "✅ MCP configuration loaded successfully"
4. **Agent mode badge**: Look for "🤖 Agent Mode Active" indicator

## Supported Commands

### Text Insertion

**Command patterns:**
- "insert text 'Your text here'"
- "add text 'Hello World'"
- "insert 'Sample content'"

**Example:**
```
User: insert text "This is automatically inserted content"
Agent: ✅ Executed: Inserted text "This is automatically inserted content"
```

### Bold Text

**Command patterns:**
- "make bold"
- "add bold text"
- "insert bold"

**Example:**
```
User: make bold text
Agent: ✅ Executed: Added bold text
```

### Replace Selection

**Command patterns:**
- "replace"
- "change selected text"
- "replace current word"

**How to use:**
1. Select text in the document editor
2. Send replace command in chat
3. Selected text will be replaced with "Text replaced by agent"

**Example:**
```
User: replace the selected text
Agent: ✅ Executed: Replaced selected text
```

## Advanced Usage

### Combining with Natural Conversation

Agent mode works alongside normal chat:

```
User: What's the best way to format a report?
Agent: [Provides formatting advice]

User: Can you insert a title for me? insert text "Annual Report 2024"
Agent: ✅ Executed: Inserted text "Annual Report 2024"
```

### Document Type Support

Different document types support different operations:

**Word Documents (.docx, .doc, .txt)**
- ✅ Insert text
- ✅ Format text (bold, italic, underline)
- ✅ Replace selection
- ✅ Add paragraphs

**Spreadsheets (.xlsx, .xls, .csv)**
- ✅ Update cell values
- ✅ Apply formatting
- ❌ Paragraph operations

**Presentations (.pptx, .ppt)**
- ✅ Update slide content
- ✅ Modify text shapes
- ❌ Cell operations

## Command Patterns Reference

| Intent | Command Examples | Effect |
|--------|-----------------|---------|
| Insert | `insert text "..."` | Adds text at cursor |
| Bold | `make bold`, `add bold text` | Inserts bold formatted text |
| Replace | `replace`, `change` | Replaces selected text |
| Format | `insert formatted "..." with bold` | Adds formatted content |

## Error Handling

### Common Issues

**"Document editor is not ready"**
- Wait for document to fully load
- Look for "✓ 已就绪" status in toolbar

**"Document automation API is not available"**
- Ensure OnlyOffice server supports Builder API
- Check document server version

**Command not recognized**
- Agent will process as normal chat
- Try more explicit command pattern
- Check if document type supports operation

## Best Practices

1. **Wait for Document Load**: Always ensure document is ready before using agent commands
2. **Use Explicit Commands**: Start with clear command words like "insert", "make", "replace"
3. **Quote Text Content**: Use quotes around text to insert: `insert text "your content"`
4. **Check Document Type**: Verify your document type supports the operation
5. **Select First for Replace**: Select text in editor before using replace commands

## Example Workflows

### Creating a Document from Scratch

```
User: Load MCP
Agent: ✅ MCP configuration loaded

User: insert text "Project Proposal"
Agent: ✅ Executed: Inserted text

User: make bold
Agent: ✅ Executed: Added bold text

User: insert text "Executive Summary: This project aims to..."
Agent: ✅ Executed: Inserted text
```

### Editing Existing Content

```
User: [Select text in editor]
User: replace with better content
Agent: ✅ Executed: Replaced selected text

User: make the next part bold
Agent: ✅ Executed: Added bold text
```

## Tips & Tricks

1. **Chain Operations**: Execute multiple commands in sequence for complex edits
2. **Natural Language**: Mix automation commands with questions and conversation
3. **Visual Feedback**: Watch the document editor update in real-time
4. **Status Monitoring**: Check the agent mode badge and editor status indicators

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Commands not working | Verify agent mode is enabled (badge visible) |
| No effect on document | Check editor status indicator shows "ready" |
| Error messages | Read error details, usually timeout or API unavailable |
| Wrong operation | Verify document type matches command type |

## Future Capabilities

The MCP configuration can be extended to support:
- Table creation and manipulation
- Image insertion
- Style application
- Complex formatting
- Multi-step workflows
- Custom macros

## API Reference

Agent mode uses OnlyOffice Builder API under the hood:

```javascript
// Example internal operation for "insert text"
var oDocument = Api.GetDocument();
var oParagraph = Api.CreateParagraph();
oParagraph.AddText("Your text");
oDocument.InsertContent([oParagraph]);
```

For more details, see: [OnlyOffice Builder API Documentation](https://api.onlyoffice.com/docbuilder/basic)
