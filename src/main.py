import os
import sys
import uvicorn

# Ensure the project root is in the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.infrastructure.api import app

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=3000, reload=True)
