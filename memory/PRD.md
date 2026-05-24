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
- Full backend API: file upload, paste, list, get content, delete, bookmarks CRUD
- MHTML parsing using Python email module
- **Folder upload with tree structure**: stores relative_path and folder_group per file
- Frontend: Swiss Brutalist design with sidebar + renderer layout
- Tabs: Files, Bookmarks, Paste
- Dropzone with drag-and-drop file upload
- **Folder upload with tree view**: collapsible folder hierarchy, indented files, chevron toggles
- Paste editor with Preview and Save & Render
- iframe-based HTML renderer with toolbar
- Viewport toggle (desktop/mobile)
- Fullscreen and refresh buttons
- Bookmark system
- Scrollable sidebar with proper overflow handling

## Test Results
- Backend: 100% (18/18 tests passed)
- Frontend: 100% (all flows validated)

## Prioritized Backlog
- P1: Confirmation dialog before delete
- P2: Search/filter files
- P2: File rename capability
- P3: Export bookmarks list
