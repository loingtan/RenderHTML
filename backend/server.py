from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import HTMLResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import email
from email import policy
import quopri
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class FileDoc(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    file_type: str  # "html" or "mhtml"
    size: int = 0
    relative_path: str = ""       # e.g. "myfolder/sub/page.html"
    folder_group: str = ""        # top-level folder name for grouping
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FileListResponse(BaseModel):
    files: List[FileDoc]

class PasteInput(BaseModel):
    name: str = "Untitled"
    content: str

class BookmarkDoc(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    file_id: str
    name: str
    note: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BookmarkCreate(BaseModel):
    file_id: str
    name: str
    note: str = ""

class BookmarkListResponse(BaseModel):
    bookmarks: List[BookmarkDoc]


class RenameInput(BaseModel):
    name: str


def parse_mhtml(raw_bytes: bytes) -> str:
    """Parse MHTML file and extract main HTML content."""
    try:
        msg = email.message_from_bytes(raw_bytes, policy=policy.default)
        if msg.is_multipart():
            for part in msg.walk():
                ct = part.get_content_type()
                if ct == "text/html":
                    payload = part.get_payload(decode=True)
                    if payload:
                        charset = part.get_content_charset() or 'utf-8'
                        return payload.decode(charset, errors='replace')
            # Fallback: return first text part
            for part in msg.walk():
                ct = part.get_content_type()
                if ct.startswith("text/"):
                    payload = part.get_payload(decode=True)
                    if payload:
                        charset = part.get_content_charset() or 'utf-8'
                        return payload.decode(charset, errors='replace')
        else:
            payload = msg.get_payload(decode=True)
            if payload:
                charset = msg.get_content_charset() or 'utf-8'
                return payload.decode(charset, errors='replace')
    except Exception as e:
        logger.error(f"MHTML parse error: {e}")
    return "<html><body><p>Failed to parse MHTML content</p></body></html>"


@api_router.get("/")
async def root():
    return {"message": "HTML Viewer API"}


@api_router.post("/files/upload", response_model=List[FileDoc])
async def upload_files(
    files: List[UploadFile] = File(...),
    paths: Optional[str] = Form(None),
):
    import json as _json
    path_list = []
    if paths:
        try:
            path_list = _json.loads(paths)
        except Exception:
            path_list = []

    results = []
    for idx, f in enumerate(files):
        raw = await f.read()
        name = f.filename or "unknown"
        ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""

        # Determine relative path from the paths metadata
        rel_path = path_list[idx] if idx < len(path_list) else ""
        folder_group = ""
        if rel_path:
            parts = rel_path.replace("\\", "/").split("/")
            if len(parts) > 1:
                folder_group = parts[0]  # top-level folder name

        if ext in ("mhtml", "mht"):
            content = parse_mhtml(raw)
            file_type = "mhtml"
        elif ext in ("html", "htm"):
            content = raw.decode("utf-8", errors="replace")
            file_type = "html"
        else:
            content = raw.decode("utf-8", errors="replace")
            file_type = "html"

        file_doc = FileDoc(
            name=name,
            file_type=file_type,
            size=len(raw),
            relative_path=rel_path,
            folder_group=folder_group,
        )
        doc = file_doc.model_dump()
        doc["content"] = content
        await db.files.insert_one(doc)
        results.append(file_doc)

    return results


@api_router.post("/files/paste", response_model=FileDoc)
async def paste_html(data: PasteInput):
    name = data.name if data.name else "Untitled.html"
    if not name.endswith(".html"):
        name += ".html"
    
    file_doc = FileDoc(name=name, file_type="html", size=len(data.content.encode("utf-8")))
    doc = file_doc.model_dump()
    doc["content"] = data.content
    await db.files.insert_one(doc)
    return file_doc


@api_router.get("/files", response_model=FileListResponse)
async def list_files():
    files = await db.files.find({}, {"_id": 0, "content": 0}).sort("created_at", -1).to_list(500)
    return FileListResponse(files=files)


@api_router.get("/files/{file_id}/content")
async def get_file_content(file_id: str):
    doc = await db.files.find_one({"id": file_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="File not found")
    return {"id": doc["id"], "name": doc["name"], "content": doc.get("content", "")}


@api_router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    result = await db.files.delete_one({"id": file_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    await db.bookmarks.delete_many({"file_id": file_id})
    return {"status": "deleted"}


@api_router.patch("/files/{file_id}/rename")
async def rename_file(file_id: str, data: RenameInput):
    new_name = data.name.strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    result = await db.files.update_one(
        {"id": file_id},
        {"$set": {"name": new_name}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="File not found")
    # Also update bookmark name if it exists
    await db.bookmarks.update_many(
        {"file_id": file_id},
        {"$set": {"name": new_name}},
    )
    return {"status": "renamed", "name": new_name}


@api_router.delete("/files")
async def delete_all_files():
    file_result = await db.files.delete_many({})
    bm_result = await db.bookmarks.delete_many({})
    return {
        "status": "deleted",
        "files_deleted": file_result.deleted_count,
        "bookmarks_deleted": bm_result.deleted_count,
    }


@api_router.post("/bookmarks", response_model=BookmarkDoc)
async def create_bookmark(data: BookmarkCreate):
    # Verify file exists
    file_doc = await db.files.find_one({"id": data.file_id}, {"_id": 0, "content": 0})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if already bookmarked
    existing = await db.bookmarks.find_one({"file_id": data.file_id}, {"_id": 0})
    if existing:
        return BookmarkDoc(**existing)
    
    bookmark = BookmarkDoc(file_id=data.file_id, name=data.name, note=data.note)
    doc = bookmark.model_dump()
    await db.bookmarks.insert_one(doc)
    return bookmark


@api_router.get("/bookmarks", response_model=BookmarkListResponse)
async def list_bookmarks():
    bookmarks = await db.bookmarks.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return BookmarkListResponse(bookmarks=bookmarks)


@api_router.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(bookmark_id: str):
    result = await db.bookmarks.delete_one({"id": bookmark_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return {"status": "deleted"}


@api_router.get("/bookmarks/export")
async def export_bookmarks():
    bookmarks = await db.bookmarks.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"bookmarks": bookmarks, "exported_at": datetime.now(timezone.utc).isoformat(), "count": len(bookmarks)}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
