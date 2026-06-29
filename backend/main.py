import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ingest import ingest_pdf
from query import query_rag
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "RAG backend is running"}

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    content = await file.read()
    ingest_pdf(content, file.filename)
    return {"status": "indexed", "filename": file.filename}

@app.post("/query")
async def query(body: dict):
    result = query_rag(body["question"])
    return result