from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# ─── GAME schemas ───────────────────────────────────────

class GameBase(BaseModel):
    name:        str
    icon:        Optional[str] = None
    capacity:    int = Field(default=6, ge=1)   # ge=1 → mínimo 1
    price_30min: float = Field(gt=0)             # gt=0 → mayor que 0
    price_60min: Optional[float] = None

class GameCreate(GameBase):
    pass

class GameResponse(GameBase):
    id:        int
    is_active: bool

    class Config:
        from_attributes = True   # permite convertir objetos SQLAlchemy a JSON


# ─── TICKET schemas ──────────────────────────────────────

class TicketCreate(BaseModel):
    game_id:          int
    duration_minutes: int = Field(default=30, ge=30, le=60)
    # ge=30 → mínimo 30 min, le=60 → máximo 60 min

class TicketResponse(BaseModel):
    id:                int
    code:              str
    game_id:           int
    duration_minutes:  int
    price:             float
    status:            str
    emitted_at:        datetime
    started_at:        Optional[datetime] = None
    estimated_end_at:  Optional[datetime] = None
    ended_at:          Optional[datetime] = None

    class Config:
        from_attributes = True

class TicketStartResponse(BaseModel):
    message:  str
    ends_at:  datetime

class TicketEndResponse(BaseModel):
    message:      str
    wait_minutes: Optional[float] = None