from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Game
from schemas import GameCreate, GameResponse

router = APIRouter(prefix="/games", tags=["games"])

@router.post("/", response_model=GameResponse)
def create_game(data: GameCreate, db: Session = Depends(get_db)):
    game = Game(**data.model_dump())
    db.add(game)
    db.commit()
    db.refresh(game)
    return game

@router.get("/", response_model=list[GameResponse])
def list_games(db: Session = Depends(get_db)):
    return db.query(Game).filter(Game.is_active == True).all()

@router.delete("/{game_id}")
def delete_game(game_id: int, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    db.delete(game)
    db.commit()

    return {"message": "Game deleted"}

@router.put("/{game_id}", response_model=GameResponse)
def update_game(game_id: int, data: GameCreate, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id).first()

    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    game.name = data.name
    game.icon = data.icon
    game.capacity = data.capacity
    game.price_30min = data.price_30min
    game.price_60min = data.price_60min

    db.commit()
    db.refresh(game)

    return game