import os
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from dotenv import load_dotenv

load_dotenv()

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
    api_key=os.getenv("GROQ_API_KEY")
)

prompt = PromptTemplate.from_template("""
Use the following context to answer the question.
If you don't know the answer, say you don't know.

Context:
{context}

Question: {question}

Answer:
""")

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

def query_rag(question: str):
    if not os.path.exists("faiss_index"):
        return {"answer": "No documents indexed yet. Please upload a PDF first.", "sources": []}

    db = FAISS.load_local(
        "faiss_index", embeddings,
        allow_dangerous_deserialization=True
    )

    retriever = db.as_retriever(search_kwargs={"k": 4})
    docs = retriever.invoke(question)

    chain = (
        {"context": lambda _: format_docs(docs), "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    answer = chain.invoke(question)

    # Extract unique page sources
    sources = []
    seen = set()
    for doc in docs:
        page = doc.metadata.get("page", None)
        source = doc.metadata.get("source", "Unknown")
        key = f"{source}-{page}"
        if key not in seen:
            seen.add(key)
            sources.append({
                "page": page + 1 if page is not None else "?",
                "file": os.path.basename(source) if source != "Unknown" else "Unknown"
            })

    return {"answer": answer, "sources": sources}