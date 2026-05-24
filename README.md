# HTML/MHTML Viewer

A minimal, locally-hostable HTML and MHTML file viewer. Upload files, paste raw HTML, browse folder structures, and render content in a sandboxed iframe.

---

## Features

- **Upload** single or multiple `.html` / `.mhtml` files
- **Upload folders** preserving directory structure (tree view)
- **Paste** raw HTML and preview or save it
- **Render** HTML/MHTML in a sandboxed iframe with desktop/mobile viewport toggle
- **Bookmark** pages for quick access
- **Search** files instantly by name or path (`Ctrl+F`)
- **Sort** files by name, date, size, or type
- **Bulk delete** all files with one click
- **Keyboard shortcuts**: `Ctrl+F` focus search, `Escape` clear search

---

## Run Locally with Docker

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+)

### Quick Start

```bash
# Clone the repo
git clone <your-repo-url>
cd html-viewer

# Start everything (first run takes ~2-3 min to build)
chmod +x start.sh
./start.sh
```

> **Note**: The first build may take a few minutes as Docker downloads base images and installs dependencies. Subsequent starts are instant.

This starts three containers:
| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000         |
| Backend  | http://localhost:8001         |
| MongoDB  | mongodb://localhost:27017     |

### Stop

```bash
docker compose down        # Stop containers
docker compose down -v     # Stop and delete stored data
```

---

## Run Locally without Docker

### Prerequisites

- Python 3.10+
- Node.js 18+ and Yarn
- MongoDB running on `localhost:27017`

### Backend

```bash
cd backend
pip install -r requirements.txt

# Create .env
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=html_viewer
CORS_ORIGINS=*
EOF

uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend

```bash
cd frontend
yarn install

# Create .env
cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF

yarn start
```

Open http://localhost:3000

---

## Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Frontend | React 19, Tailwind CSS, Shadcn/UI  |
| Backend  | Python, FastAPI, Motor (async MongoDB) |
| Database | MongoDB                            |
| Fonts    | Cabinet Grotesk, IBM Plex Sans, JetBrains Mono |

---

## API Endpoints

| Method | Endpoint                    | Description                  |
|--------|-----------------------------|------------------------------|
| GET    | `/api/files`                | List all files               |
| POST   | `/api/files/upload`         | Upload files (multipart)     |
| POST   | `/api/files/paste`          | Save pasted HTML             |
| GET    | `/api/files/{id}/content`   | Get file content             |
| DELETE | `/api/files/{id}`           | Delete a file                |
| DELETE | `/api/files`                | Delete all files             |
| GET    | `/api/bookmarks`            | List bookmarks               |
| POST   | `/api/bookmarks`            | Create bookmark              |
| DELETE | `/api/bookmarks/{id}`       | Delete bookmark              |

---

## Project Structure

```
.
├── docker-compose.yml      # Docker orchestration
├── start.sh                # One-click local start script
├── backend/
│   ├── Dockerfile
│   ├── server.py           # FastAPI app
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── Dockerfile
    ├── nginx.conf           # Production nginx config
    ├── package.json
    ├── src/
    │   ├── App.js
    │   ├── context/AppContext.jsx
    │   └── components/
    │       ├── Sidebar.jsx
    │       ├── Renderer.jsx
    │       ├── FileList.jsx
    │       ├── Dropzone.jsx
    │       ├── BookmarkList.jsx
    │       └── PasteEditor.jsx
    └── .env
```
