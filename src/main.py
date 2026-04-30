import uvicorn
from src.infrastructure.api import app

if __name__ == "__main__":
    uvicorn.run("src.infrastructure.api:app", host="0.0.0.0", port=3000, reload=True)
