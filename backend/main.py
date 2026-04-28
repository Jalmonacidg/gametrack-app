from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import tickets, games

# Crea las tablas en PostgreSQL si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GameTrack API",
    description="Sistema de tickets para juegos infantiles",
    version="1.0.0"
)

# CORS → permite que el frontend React se comunique con la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # puerto de Vite (React)
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router)
app.include_router(games.router)

@app.get("/")
def root():
    return {"status": "GameTrack API corriendo ✓"}