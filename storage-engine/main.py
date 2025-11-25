import os
import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import aiofiles
import httpx
from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

# Create FastAPI application
app = FastAPI(
    title="Storage Engine for OA-Pilot",
    description="Component: Storage Engine, it is for file storage and management.",
    version="1.0.0"
)

# Configure CORS - allow cross-origin access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# File storage directory
UPLOAD_DIR = Path("docs")
UPLOAD_DIR.mkdir(exist_ok=True)


class FileInfo(BaseModel):
    """File information model"""
    version: int
    id: str
    contentLength: str
    pureContentLength: int
    title: str
    updated: str


class OnlyOfficeCallback(BaseModel):
    """OnlyOffice callback request model"""
    key: str
    status: int
    url: Optional[str] = None
    changesurl: Optional[str] = None
    filetype: Optional[str] = None
    forcesavetype: Optional[int] = None
    users: Optional[List[str]] = None
    actions: Optional[List[dict]] = None
    history: Optional[dict] = None


def format_file_size(size_bytes: int) -> str:
    """Format file size"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"


def sanitize_filename(filename: str) -> str:
    """
    清理文件名，将空格和特殊字符替换为下划线，确保URL安全
    保留：字母、数字、中文、下划线、连字符、点号
    替换：空格和其他特殊字符为下划线
    """
    if not filename:
        return filename
    
    # 分离文件名和扩展名
    stem = Path(filename).stem
    suffix = Path(filename).suffix
    
    # 定义允许的字符：字母、数字、中文字符、下划线、连字符
    # 替换空格和其他特殊字符为下划线
    # 保留中文字符：\u4e00-\u9fff
    safe_stem = re.sub(r'[^\w\u4e00-\u9fff-]', '_', stem)
    
    # 清理扩展名（通常扩展名只包含字母和数字）
    safe_suffix = re.sub(r'[^\w.-]', '_', suffix)
    
    # 去除连续的下划线
    safe_stem = re.sub(r'_+', '_', safe_stem)
    
    # 去除首尾的下划线
    safe_stem = safe_stem.strip('_')
    
    # 如果文件名被完全清理掉了，使用默认名称
    if not safe_stem:
        safe_stem = "unnamed_file"
    
    return f"{safe_stem}{safe_suffix}"


def get_unique_filename(directory: Path, filename: str) -> str:
    """
    Get a unique filename. If the filename already exists, add suffix _01, _02, ...
    Example: ai.docx -> ai_01.docx, ai_02.docx, ai_03.docx
    """
    file_path = directory / filename
    
    # If file doesn't exist, return the original filename directly
    if not file_path.exists():
        return filename
    
    # Separate filename and extension
    stem = Path(filename).stem  # Filename (without extension)
    suffix = Path(filename).suffix  # Extension (including dot)
    
    # Find an available filename
    counter = 1
    while True:
        new_filename = f"{stem}_{counter:02d}{suffix}"
        new_path = directory / new_filename
        if not new_path.exists():
            return new_filename
        counter += 1
        
        # Prevent infinite loop (though unlikely)
        if counter > 999:
            raise ValueError("Unable to generate unique filename, maximum attempts reached")


def get_file_info(file_path: Path) -> FileInfo:
    """Get file information"""
    stat = file_path.stat()
    file_size = stat.st_size
    modified_time = datetime.fromtimestamp(stat.st_mtime)
    
    # Generate file ID (can be customized as needed)
    file_id = f"{file_path.name}{int(modified_time.timestamp() * 1000)}"
    
    return FileInfo(
        version=2,
        id=file_id,
        contentLength=format_file_size(file_size),
        pureContentLength=file_size,
        title=file_path.name,
        updated=modified_time.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    )


@app.get("/")
async def root():
    """Root path"""
    return {"message": "Storage Engine is running", "docs": "/docs"}


@app.get("/example/files", response_model=List[FileInfo])
async def list_files():
    """List all files"""
    files = []
    for file_path in UPLOAD_DIR.iterdir():
        if file_path.is_file():
            try:
                file_info = get_file_info(file_path)
                files.append(file_info)
            except Exception as e:
                print(f"Error processing file {file_path}: {e}")
    
    # Sort by update time in descending order
    files.sort(key=lambda x: x.updated, reverse=True)
    return files


@app.delete("/example/file")
async def delete_file(filename: str = Query(..., description="Filename to delete")):
    """Delete file"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File does not exist")
    
    if not file_path.is_file():
        raise HTTPException(status_code=400, detail="Not a valid file")
    
    try:
        file_path.unlink()
        return JSONResponse(
            content={"message": "File deleted successfully", "filename": filename},
            status_code=200
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@app.post("/example/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename cannot be empty")
    
    # 1. 清理文件名，替换空格和特殊字符为下划线
    sanitized_filename = sanitize_filename(file.filename)
    
    # 2. 获取唯一文件名（如果重复则自动添加后缀）
    unique_filename = get_unique_filename(UPLOAD_DIR, sanitized_filename)
    file_path = UPLOAD_DIR / unique_filename
    
    try:
        # Write file asynchronously
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        file_info = get_file_info(file_path)
        
        response_content = {
            "message": "File uploaded successfully",
            "filename": unique_filename,
            "size": file_info.contentLength,
            "file_info": file_info.dict()
        }
        
        # 添加提示信息：如果文件名被修改
        filename_changed = []
        if sanitized_filename != file.filename:
            filename_changed.append("cleaned special characters")
        if unique_filename != sanitized_filename:
            filename_changed.append("added number suffix to avoid duplication")
        
        if filename_changed:
            response_content["message"] = f"File uploaded successfully (filename automatically adjusted: {', '.join(filename_changed)})"
            response_content["original_filename"] = file.filename
        
        return JSONResponse(
            content=response_content,
            status_code=200
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")


@app.get("/example/download")
async def download_file(fileName: str = Query(..., description="Filename to download")):
    """Download file"""
    file_path = UPLOAD_DIR / fileName
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File does not exist")
    
    if not file_path.is_file():
        raise HTTPException(status_code=400, detail="Not a valid file")
    
    return FileResponse(
        path=file_path,
        filename=fileName,
        media_type='application/octet-stream'
    )


@app.post("/example/track")
async def track_callback(request: Request, filename: str = Query(..., description="Filename being edited")):
    """
    OnlyOffice Document Server callback endpoint
    
    This endpoint receives callbacks from OnlyOffice when document editing status changes:
    - Status 1: Document is being edited
    - Status 2: Document is ready for saving (user closed editor with changes)
    - Status 3: Document saving error
    - Status 4: Document closed without changes
    - Status 6: Document is being edited, but current state is saved (force save)
    - Status 7: Error during force save
    """
    try:
        # Parse the callback payload
        body = await request.json()
        callback_data = OnlyOfficeCallback(**body)
        
        print(f"📝 OnlyOffice callback received for '{filename}':")
        print(f"   Status: {callback_data.status}")
        print(f"   Key: {callback_data.key}")
        
        # Status 2 or 6: Document is ready to be saved
        if callback_data.status in [2, 6]:
            if not callback_data.url:
                print(f"⚠️  Warning: No download URL provided in callback")
                return JSONResponse(content={"error": 1, "message": "No URL provided"})
            
            print(f"💾 Downloading edited document from: {callback_data.url}")
            
            # Download the edited document from OnlyOffice server
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(callback_data.url)
                response.raise_for_status()
                
                # Save the edited document back to storage
                file_path = UPLOAD_DIR / filename
                async with aiofiles.open(file_path, 'wb') as f:
                    await f.write(response.content)
                
                file_size = len(response.content)
                print(f"✓ Document saved successfully: {filename} ({format_file_size(file_size)})")
                
                if callback_data.status == 2:
                    print(f"   Reason: User closed editor with changes")
                elif callback_data.status == 6:
                    print(f"   Reason: Force save (type: {callback_data.forcesavetype})")
        
        # Status 1: Document being edited (user connected)
        elif callback_data.status == 1:
            print(f"👤 User is editing the document")
            if callback_data.users:
                print(f"   Active users: {', '.join(callback_data.users)}")
        
        # Status 4: Document closed without changes
        elif callback_data.status == 4:
            print(f"✓ Document closed without changes")
        
        # Status 3 or 7: Error during save
        elif callback_data.status in [3, 7]:
            error_type = "save" if callback_data.status == 3 else "force save"
            print(f"❌ Error during {error_type}")
            return JSONResponse(content={"error": 1, "message": f"Error during {error_type}"})
        
        # Return success response (required by OnlyOffice)
        return JSONResponse(content={"error": 0})
        
    except httpx.HTTPError as e:
        print(f"❌ Error downloading document from OnlyOffice: {e}")
        return JSONResponse(content={"error": 1, "message": f"Download failed: {str(e)}"})
    
    except Exception as e:
        print(f"❌ Error processing callback: {e}")
        return JSONResponse(content={"error": 1, "message": str(e)})


@app.on_event("startup")
async def startup_event():
    """Server startup event"""
    port = int(os.getenv("PORT", 8000))
    print(f"\n{'='*60}")
    print(f"🚀 Storage Engine Server Started!")
    print(f"{'='*60}")
    print(f"📡 Server running on: http://0.0.0.0:{port}")
    print(f"📁 API endpoints: http://localhost:{port}/example/")
    print(f"📖 API docs (Swagger): http://localhost:{port}/docs")
    print(f"💾 File storage directory: {UPLOAD_DIR.resolve()}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
