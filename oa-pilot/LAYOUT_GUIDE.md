# Application Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [◀️ Files]  SDK Tests: [📝 Update] [✨ Format] [🔄 Replace]  [Chat ▶️] │
├──────────┬──────────────────────────────────────────┬───────────────────┤
│          │                                          │                   │
│  Files   │         Document Editor                  │   AI Assistant    │
│          │                                          │                   │
│ 📄 doc1  │  ┌────────────────────────────────┐    │  [🔧 Load MCP]   │
│ 📊 sheet │  │                                │    │                   │
│ 📽️ slide │  │    OnlyOffice Editor           │    │  💬 Chat Messages │
│ 📋 mcp   │  │    (Word/Excel/PowerPoint)     │    │                   │
│          │  │                                │    │  User: Hi         │
│ [🔄]     │  │    Edit documents here...      │    │  AI: Hello!       │
│          │  │                                │    │                   │
│          │  └────────────────────────────────┘    │  [Type message..] │
│          │                                          │  [📤 Send]        │
└──────────┴──────────────────────────────────────────┴───────────────────┘
```

## Key Features Layout:

### Left Panel (280px, collapsible)
- File list with icons
- Refresh button
- Click to open documents
- Scrollable list

### Center Panel (flexible)
- Full OnlyOffice document editor
- SDK test buttons in toolbar
- Handles Word, Excel, PowerPoint files
- Real-time editing

### Right Panel (400px, collapsible)
- AI chat interface
- Load MCP button
- Agent mode indicator
- Message history
- Text input area

### Top Toolbar
- Toggle buttons for panels
- SDK test functions
- Status indicators
- Quick actions

## Responsive Behavior

- **Desktop (>1200px)**: All three panels visible
- **Tablet (900-1200px)**: Narrower side panels
- **Mobile (<768px)**: Panels become overlays with toggle buttons
