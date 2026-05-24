"""
Backend API tests for HTML/MHTML Viewer.
Covers: file upload, paste, list, get content, delete, bookmarks CRUD.
"""
import os
import io
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to reading from frontend .env
    env_path = "/app/frontend/.env"
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break

API = f"{BASE_URL}/api"

SAMPLE_HTML = "<html><body><h1>TEST_Hello</h1><p>Sample paragraph</p></body></html>"
SAMPLE_MHTML = (
    "From: <Saved by Browser>\r\n"
    "Subject: Test\r\n"
    "MIME-Version: 1.0\r\n"
    'Content-Type: multipart/related; boundary="----=_NextPart_TEST"\r\n\r\n'
    "------=_NextPart_TEST\r\n"
    "Content-Type: text/html; charset=utf-8\r\n"
    "Content-Transfer-Encoding: 8bit\r\n\r\n"
    "<html><body><h2>TEST_MHTML</h2></body></html>\r\n"
    "------=_NextPart_TEST--\r\n"
)


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    return s


@pytest.fixture(scope="module")
def created_ids():
    return {"files": [], "bookmarks": []}


# ----- Root / Health -----
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert "message" in r.json()


# ----- Files: upload, paste, list, content, delete -----
class TestFiles:
    def test_upload_html_file(self, session, created_ids):
        files = {"files": ("TEST_sample.html", SAMPLE_HTML.encode("utf-8"), "text/html")}
        r = session.post(f"{API}/files/upload", files=files)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list) and len(data) == 1
        f = data[0]
        assert f["name"] == "TEST_sample.html"
        assert f["file_type"] == "html"
        assert f["size"] == len(SAMPLE_HTML)
        assert "id" in f and isinstance(f["id"], str)
        created_ids["files"].append(f["id"])

    def test_upload_mhtml_file(self, session, created_ids):
        files = {"files": ("TEST_sample.mhtml", SAMPLE_MHTML.encode("utf-8"), "multipart/related")}
        r = session.post(f"{API}/files/upload", files=files)
        assert r.status_code == 200, r.text
        data = r.json()
        assert len(data) == 1
        assert data[0]["file_type"] == "mhtml"
        created_ids["files"].append(data[0]["id"])

        # Verify mhtml parsed content via /content endpoint
        cid = data[0]["id"]
        r2 = session.get(f"{API}/files/{cid}/content")
        assert r2.status_code == 200
        body = r2.json()
        assert "TEST_MHTML" in body["content"]

    def test_upload_multiple_files(self, session, created_ids):
        files = [
            ("files", ("TEST_a.html", b"<p>A</p>", "text/html")),
            ("files", ("TEST_b.html", b"<p>B</p>", "text/html")),
        ]
        r = session.post(f"{API}/files/upload", files=files)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 2
        for d in data:
            # No paths passed -> empty relative_path / folder_group
            assert d.get("relative_path", "") == ""
            assert d.get("folder_group", "") == ""
            created_ids["files"].append(d["id"])

    # ----- NEW: folder upload with paths -----
    def test_upload_with_paths_creates_folder_metadata(self, session, created_ids):
        import json as _json
        files = [
            ("files", ("index.html", b"<p>idx</p>", "text/html")),
            ("files", ("about.html", b"<p>about</p>", "text/html")),
            ("files", ("contact.html", b"<p>contact</p>", "text/html")),
        ]
        paths = [
            "TEST_mysite/index.html",
            "TEST_mysite/pages/about.html",
            "TEST_mysite/pages/contact.html",
        ]
        data = {"paths": _json.dumps(paths)}
        r = session.post(f"{API}/files/upload", files=files, data=data)
        assert r.status_code == 200, r.text
        result = r.json()
        assert len(result) == 3
        # Each file should carry its relative_path & folder_group == top-level dir
        for d, p in zip(result, paths):
            assert d["relative_path"] == p
            assert d["folder_group"] == "TEST_mysite"
            created_ids["files"].append(d["id"])

        # Verify persistence via /files listing
        rlist = session.get(f"{API}/files")
        assert rlist.status_code == 200
        listed = {f["id"]: f for f in rlist.json()["files"]}
        for d in result:
            assert d["id"] in listed
            assert listed[d["id"]]["relative_path"] == d["relative_path"]
            assert listed[d["id"]]["folder_group"] == "TEST_mysite"

    def test_upload_with_malformed_paths_json_does_not_crash(self, session, created_ids):
        # Invalid JSON for paths -> server should treat as empty list, not error
        files = [("files", ("TEST_malformed.html", b"<p>x</p>", "text/html"))]
        r = session.post(f"{API}/files/upload", files=files, data={"paths": "not-json"})
        assert r.status_code == 200, r.text
        d = r.json()[0]
        assert d["relative_path"] == ""
        assert d["folder_group"] == ""
        created_ids["files"].append(d["id"])

    def test_upload_paths_fewer_than_files(self, session, created_ids):
        import json as _json
        files = [
            ("files", ("TEST_p1.html", b"<p>1</p>", "text/html")),
            ("files", ("TEST_p2.html", b"<p>2</p>", "text/html")),
        ]
        paths = ["TEST_folderX/TEST_p1.html"]  # only 1 path for 2 files
        r = session.post(f"{API}/files/upload", files=files, data={"paths": _json.dumps(paths)})
        assert r.status_code == 200
        result = r.json()
        assert len(result) == 2
        assert result[0]["relative_path"] == "TEST_folderX/TEST_p1.html"
        assert result[0]["folder_group"] == "TEST_folderX"
        # 2nd file has no matching path -> empty
        assert result[1]["relative_path"] == ""
        assert result[1]["folder_group"] == ""
        for d in result:
            created_ids["files"].append(d["id"])

    def test_paste_html(self, session, created_ids):
        payload = {"name": "TEST_pasted", "content": "<h3>TEST_pasted_content</h3>"}
        r = session.post(f"{API}/files/paste", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"].endswith(".html")
        assert data["name"].startswith("TEST_pasted")
        assert data["file_type"] == "html"
        assert "id" in data
        created_ids["files"].append(data["id"])

    def test_paste_default_name(self, session, created_ids):
        payload = {"content": "<p>TEST_default_name</p>"}
        r = session.post(f"{API}/files/paste", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["name"]  # has some name
        created_ids["files"].append(data["id"])

    def test_list_files(self, session, created_ids):
        r = session.get(f"{API}/files")
        assert r.status_code == 200
        data = r.json()
        assert "files" in data
        ids = [f["id"] for f in data["files"]]
        for fid in created_ids["files"]:
            assert fid in ids, f"Created file {fid} not in list"
        # content must NOT be in list responses
        for f in data["files"]:
            assert "content" not in f
            assert "_id" not in f

    def test_get_file_content(self, session, created_ids):
        fid = created_ids["files"][0]
        r = session.get(f"{API}/files/{fid}/content")
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == fid
        assert "content" in data
        assert "TEST_Hello" in data["content"]
        assert "_id" not in data

    def test_get_file_content_404(self, session):
        r = session.get(f"{API}/files/nonexistent-id-xyz/content")
        assert r.status_code == 404


# ----- Bookmarks -----
class TestBookmarks:
    def test_create_bookmark(self, session, created_ids):
        # Need at least one file
        assert len(created_ids["files"]) > 0
        fid = created_ids["files"][0]
        payload = {"file_id": fid, "name": "TEST_bookmark1", "note": "test note"}
        r = session.post(f"{API}/bookmarks", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["file_id"] == fid
        assert data["name"] == "TEST_bookmark1"
        assert "id" in data
        created_ids["bookmarks"].append(data["id"])

    def test_create_bookmark_invalid_file(self, session):
        r = session.post(f"{API}/bookmarks", json={"file_id": "nonexistent", "name": "x"})
        assert r.status_code == 404

    def test_create_bookmark_duplicate_returns_existing(self, session, created_ids):
        # Already bookmarked file - should return existing
        fid = created_ids["files"][0]
        r = session.post(f"{API}/bookmarks", json={"file_id": fid, "name": "different"})
        assert r.status_code == 200
        data = r.json()
        # Should be the same bookmark id as created earlier
        assert data["id"] == created_ids["bookmarks"][0]

    def test_list_bookmarks(self, session, created_ids):
        r = session.get(f"{API}/bookmarks")
        assert r.status_code == 200
        data = r.json()
        assert "bookmarks" in data
        ids = [b["id"] for b in data["bookmarks"]]
        for bid in created_ids["bookmarks"]:
            assert bid in ids

    def test_delete_bookmark(self, session, created_ids):
        bid = created_ids["bookmarks"][0]
        r = session.delete(f"{API}/bookmarks/{bid}")
        assert r.status_code == 200
        # Verify removed
        r2 = session.get(f"{API}/bookmarks")
        ids = [b["id"] for b in r2.json()["bookmarks"]]
        assert bid not in ids
        created_ids["bookmarks"].remove(bid)

    def test_delete_bookmark_404(self, session):
        r = session.delete(f"{API}/bookmarks/nonexistent-bm")
        assert r.status_code == 404

    def test_delete_file_removes_bookmarks(self, session, created_ids):
        # Create a new file & bookmark it, then delete file -> bookmark gone
        payload = {"name": "TEST_for_cascade", "content": "<p>cascade</p>"}
        rf = session.post(f"{API}/files/paste", json=payload)
        fid = rf.json()["id"]
        rb = session.post(f"{API}/bookmarks", json={"file_id": fid, "name": "TEST_cascade_bm"})
        bid = rb.json()["id"]

        # Delete the file
        rd = session.delete(f"{API}/files/{fid}")
        assert rd.status_code == 200

        # Bookmark should be gone too
        r2 = session.get(f"{API}/bookmarks")
        ids = [b["id"] for b in r2.json()["bookmarks"]]
        assert bid not in ids


# ----- Bulk Delete (NEW) -----
class TestBulkDelete:
    def test_delete_all_files_and_bookmarks(self, session):
        # Seed some data first
        files = [
            ("files", ("TEST_bulk1.html", b"<p>1</p>", "text/html")),
            ("files", ("TEST_bulk2.html", b"<p>2</p>", "text/html")),
        ]
        r = session.post(f"{API}/files/upload", files=files)
        assert r.status_code == 200
        created = r.json()
        assert len(created) == 2

        # Add a bookmark
        rb = session.post(
            f"{API}/bookmarks",
            json={"file_id": created[0]["id"], "name": "TEST_bulk_bm"},
        )
        assert rb.status_code == 200

        # Pre-conditions
        pre_files = session.get(f"{API}/files").json()["files"]
        pre_bms = session.get(f"{API}/bookmarks").json()["bookmarks"]
        assert len(pre_files) >= 2
        assert len(pre_bms) >= 1

        # Bulk delete
        rd = session.delete(f"{API}/files")
        assert rd.status_code == 200, rd.text
        data = rd.json()
        assert data["status"] == "deleted"
        assert data["files_deleted"] == len(pre_files)
        assert data["bookmarks_deleted"] == len(pre_bms)
        assert isinstance(data["files_deleted"], int)
        assert isinstance(data["bookmarks_deleted"], int)

        # Verify both collections are empty
        assert session.get(f"{API}/files").json()["files"] == []
        assert session.get(f"{API}/bookmarks").json()["bookmarks"] == []

    def test_delete_all_when_empty(self, session):
        # Should be empty after previous test; calling again still 200 with 0 counts
        rd = session.delete(f"{API}/files")
        assert rd.status_code == 200
        data = rd.json()
        assert data["files_deleted"] == 0
        assert data["bookmarks_deleted"] == 0


# ----- Rename (NEW) -----
class TestRename:
    def test_rename_file_updates_name_and_bookmark(self, session):
        # Create a file
        rf = session.post(f"{API}/files/paste", json={"name": "TEST_orig", "content": "<p>x</p>"})
        assert rf.status_code == 200
        fid = rf.json()["id"]

        # Bookmark it
        rb = session.post(f"{API}/bookmarks", json={"file_id": fid, "name": "TEST_orig.html"})
        assert rb.status_code == 200
        bid = rb.json()["id"]

        # Rename
        rn = session.patch(f"{API}/files/{fid}/rename", json={"name": "TEST_renamed.html"})
        assert rn.status_code == 200, rn.text
        data = rn.json()
        assert data["status"] == "renamed"
        assert data["name"] == "TEST_renamed.html"

        # Verify file name updated via list
        rlist = session.get(f"{API}/files").json()["files"]
        found = [f for f in rlist if f["id"] == fid]
        assert len(found) == 1
        assert found[0]["name"] == "TEST_renamed.html"

        # Verify bookmark name also updated
        bms = session.get(f"{API}/bookmarks").json()["bookmarks"]
        found_b = [b for b in bms if b["id"] == bid]
        assert len(found_b) == 1
        assert found_b[0]["name"] == "TEST_renamed.html"

        # cleanup
        session.delete(f"{API}/files/{fid}")

    def test_rename_empty_name_rejected(self, session):
        rf = session.post(f"{API}/files/paste", json={"name": "TEST_empty", "content": "<p>x</p>"})
        fid = rf.json()["id"]
        rn = session.patch(f"{API}/files/{fid}/rename", json={"name": "   "})
        assert rn.status_code == 400
        session.delete(f"{API}/files/{fid}")

    def test_rename_nonexistent_returns_404(self, session):
        rn = session.patch(f"{API}/files/totally-fake-xyz/rename", json={"name": "anything"})
        assert rn.status_code == 404


# ----- Export Bookmarks (NEW) -----
class TestExportBookmarks:
    def test_export_bookmarks_structure(self, session):
        # Seed file + bookmark
        rf = session.post(f"{API}/files/paste", json={"name": "TEST_export", "content": "<p>x</p>"})
        fid = rf.json()["id"]
        rb = session.post(f"{API}/bookmarks", json={"file_id": fid, "name": "TEST_export_bm", "note": "n"})
        bid = rb.json()["id"]

        re = session.get(f"{API}/bookmarks/export")
        assert re.status_code == 200, re.text
        data = re.json()
        assert "bookmarks" in data
        assert "count" in data
        assert "exported_at" in data
        assert isinstance(data["bookmarks"], list)
        assert isinstance(data["count"], int)
        assert data["count"] == len(data["bookmarks"])
        # Our created bookmark should be present
        ids = [b["id"] for b in data["bookmarks"]]
        assert bid in ids
        # No mongo _id leakage
        for b in data["bookmarks"]:
            assert "_id" not in b

        # cleanup
        session.delete(f"{API}/files/{fid}")

    def test_export_empty_bookmarks(self, session):
        # Clear all
        session.delete(f"{API}/files")
        re = session.get(f"{API}/bookmarks/export")
        assert re.status_code == 200
        data = re.json()
        assert data["count"] == 0
        assert data["bookmarks"] == []


# ----- Markdown + PDF + Content Update (NEW) -----
SAMPLE_MD = "# TEST_Heading\n\n**bold** _italic_\n\n- item1\n- item2\n\n```mermaid\ngraph TD;A-->B;\n```\n"
# Minimal valid PDF bytes
SAMPLE_PDF = (
    b"%PDF-1.4\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000100 00000 n\n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF\n"
)


class TestMarkdownPdf:
    def test_upload_markdown(self, session, created_ids):
        files = {"files": ("TEST_doc.md", SAMPLE_MD.encode("utf-8"), "text/markdown")}
        r = session.post(f"{API}/files/upload", files=files)
        assert r.status_code == 200, r.text
        d = r.json()[0]
        assert d["file_type"] == "markdown"
        assert d["name"] == "TEST_doc.md"
        assert d["size"] == len(SAMPLE_MD.encode("utf-8"))
        created_ids["files"].append(d["id"])

        # GET content -> should be raw markdown text + file_type=markdown
        rc = session.get(f"{API}/files/{d['id']}/content")
        assert rc.status_code == 200
        body = rc.json()
        assert body["file_type"] == "markdown"
        assert "TEST_Heading" in body["content"]
        assert "```mermaid" in body["content"]

    def test_upload_pdf(self, session, created_ids):
        files = {"files": ("TEST_doc.pdf", SAMPLE_PDF, "application/pdf")}
        r = session.post(f"{API}/files/upload", files=files)
        assert r.status_code == 200, r.text
        d = r.json()[0]
        assert d["file_type"] == "pdf"
        assert d["size"] == len(SAMPLE_PDF)
        created_ids["files"].append(d["id"])

        # Content should be base64-encoded and decodable to original bytes
        rc = session.get(f"{API}/files/{d['id']}/content")
        assert rc.status_code == 200
        body = rc.json()
        assert body["file_type"] == "pdf"
        import base64 as _b
        decoded = _b.b64decode(body["content"])
        assert decoded == SAMPLE_PDF

    def test_get_content_returns_file_type_field(self, session, created_ids):
        # Upload a fresh file (prior bulk-delete tests may have wiped DB)
        files = {"files": ("TEST_typecheck.html", b"<p>tc</p>", "text/html")}
        r = session.post(f"{API}/files/upload", files=files)
        fid = r.json()[0]["id"]
        created_ids["files"].append(fid)
        rc = session.get(f"{API}/files/{fid}/content")
        assert rc.status_code == 200
        body = rc.json()
        assert "file_type" in body
        assert body["file_type"] == "html"

    def test_patch_markdown_content_updates_size(self, session, created_ids):
        # Create a fresh md file
        files = {"files": ("TEST_edit.md", b"# old\n", "text/markdown")}
        r = session.post(f"{API}/files/upload", files=files)
        fid = r.json()[0]["id"]
        created_ids["files"].append(fid)

        new_content = "# TEST_new heading\n\nMore content"
        ru = session.patch(f"{API}/files/{fid}/content", json={"content": new_content})
        assert ru.status_code == 200, ru.text
        data = ru.json()
        assert data["status"] == "updated"
        assert data["size"] == len(new_content.encode("utf-8"))

        # Verify persisted
        rc = session.get(f"{API}/files/{fid}/content")
        assert rc.status_code == 200
        assert rc.json()["content"] == new_content

        # Verify list reflects new size
        rl = session.get(f"{API}/files").json()["files"]
        found = [f for f in rl if f["id"] == fid]
        assert len(found) == 1
        assert found[0]["size"] == len(new_content.encode("utf-8"))

    def test_patch_non_markdown_rejected(self, session, created_ids):
        # Upload a fresh HTML file
        files = {"files": ("TEST_nonmd.html", b"<p>x</p>", "text/html")}
        r = session.post(f"{API}/files/upload", files=files)
        html_id = r.json()[0]["id"]
        created_ids["files"].append(html_id)
        ru = session.patch(f"{API}/files/{html_id}/content", json={"content": "x"})
        assert ru.status_code == 400
        body = ru.json()
        assert "markdown" in (body.get("detail") or "").lower()

    def test_patch_nonexistent_file_returns_404(self, session):
        ru = session.patch(f"{API}/files/nonexistent-xyz/content", json={"content": "x"})
        assert ru.status_code == 404


# ----- Cleanup -----
class TestCleanup:
    def test_delete_all_test_files(self, session, created_ids):
        for fid in list(created_ids["files"]):
            r = session.delete(f"{API}/files/{fid}")
            # 200 or 404 (if cascade already removed)
            assert r.status_code in (200, 404)

    def test_delete_nonexistent_file(self, session):
        r = session.delete(f"{API}/files/totally-fake-id")
        assert r.status_code == 404
