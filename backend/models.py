from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Game(Base):
    __tablename__ = "games"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(100), nullable=False)
    icon        = Column(String(10))
    capacity    = Column(Integer, default=6)
    price_30min = Column(Numeric(6, 2), nullable=False)
    price_60min = Column(Numeric(6, 2))
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime, server_default=func.now())


class Ticket(Base):
    __tablename__ = "tickets"

    id               = Column(Integer, primary_key=True, index=True)
    code             = Column(String(20), unique=True, nullable=False)
    game_id          = Column(Integer, ForeignKey("games.id"))
    duration_minutes = Column(Integer, default=30)
    price            = Column(Numeric(6, 2), nullable=False)
    paid             = Column(Boolean, default=False)
    emitted_at       = Column(DateTime, server_default=func.now())
    started_at       = Column(DateTime, nullable=True)
    estimated_end_at = Column(DateTime, nullable=True)
    ended_at         = Column(DateTime, nullable=True)
    status           = Column(String(20), default="EMITIDO")
    created_at       = Column(DateTime, server_default=func.now())