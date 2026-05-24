# HTML/MHTML Viewer - PRD

## Original Problem Statement
Build an app that can render HTML inside and view it - an actual HTML/MHTML viewer.

## User Choices
- Input methods: Upload .html/.mhtml files, paste raw HTML, upload whole folders
- Features: Simple viewer with save/bookmark rendered pages
- No authentication
- Minimal design

## Architecture
- **Backend**: FastAPI + MongoDB (Motor)
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Database**: MongoDB (collections: `files`, `bookmarks`)

## Core Requirements
- Upload single/multiple HTML/MHTML files
- Upload entire folders of HTML/MHTML files
- Paste raw HTML code and render
- Render HTML content in sandboxed iframe
- Bookmark/save rendered pages
- Desktop/Mobile viewport toggle
- Fullscreen mode
- Delete files and bookmarks

## What's Been Implemented (2026-05-23)
- Full backend API: file upload, paste, list, get content, delete, bookmarks CRUD, **bulk delete**
- MHTML parsing using Python email module
- **Folder upload with tree structure**: stores relative_path and folder_group per file
- Frontend: Swiss Brutalist design with sidebar + renderer layout
- Tabs: Files, Bookmarks, Paste
- Dropzone with drag-and-drop file upload
- **Folder upload with tree view**: collapsible folder hierarchy, indented files, chevron toggles
- **Search/filter bar**: instant filtering by name/path, flat results with path context
- **Keyboard shortcuts**: Ctrl+F to focus search, Escape to clear
- **Bulk delete**: Clear All button with confirmation dialog
- **Sort dropdown**: 7 sort options (name, date, size, type)
- **File rename**: Inline rename with pencil icon, Enter/Escape/confirm/cancel
- **Export bookmarks**: Download bookmarks as JSON file
- Paste editor with Preview and Save & Render
- iframe-based HTML renderer with toolbar
- Viewport toggle (desktop/mobile)
- Fullscreen and refresh buttons
- Bookmark system
- Scrollable sidebar with proper overflow handling

## Local Hosting
- Docker Compose: `docker-compose.yml` with MongoDB, Backend, Frontend services
- Dockerfiles for backend (Python 3.11) and frontend (Node 20 + nginx)
- One-click start script: `./start.sh`
- Comprehensive README with Docker and non-Docker setup instructions

## Test Results
- Backend: 100% (28/28 tests passed across 5 iterations)
- Frontend: 100% (all flows validated)

## Prioritized Backlog
- P3: Shareable public links for rendered pages
- P3: Import bookmarks from JSON
