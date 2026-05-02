from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy import func, cast, Date
from datetime import datetime, timedelta
from database import get_db
from models import Ticket, Game
from schemas import TicketCreate, TicketResponse, TicketStartResponse, TicketEndResponse

router = APIRouter(prefix="/tickets", tags=["tickets"])


def generate_code(db: Session) -> str:
    count = db.query(func.count(Ticket.id)).scalar()
    return f"TK-{str(count + 1).zfill(4)}"


# 1️⃣ EMITIR ticket — cobro en caja, niño aún no entra
@router.post("/emit", response_model=TicketResponse)
def emit_ticket(data: TicketCreate, db: Session = Depends(get_db)):

    # Verificar que el juego existe
    game = db.query(Game).filter(Game.id == data.game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Juego no encontrado")

    # Verificar capacidad — solo cuenta los EN_JUEGO, no los EMITIDOS
    active_count = db.query(Ticket).filter(
        Ticket.game_id == data.game_id,
        Ticket.status == "EN_JUEGO"
    ).count()
    if active_count >= game.capacity:
        raise HTTPException(status_code=400, detail="Juego lleno")

    # Determinar precio según duración
    price = game.price_30min if data.duration_minutes == 30 else game.price_60min
    if price is None:
        raise HTTPException(status_code=400, detail="Duración no disponible para este juego")

    ticket = Ticket(
        code=generate_code(db),
        game_id=data.game_id,
        duration_minutes=data.duration_minutes,
        price=price,
        status="EMITIDO"
        # started_at queda NULL — el tiempo NO corre aún
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


# 2️⃣ INICIAR juego — niño entra físicamente, aquí arranca el timer
@router.patch("/{ticket_id}/start", response_model=TicketStartResponse)
def start_ticket(ticket_id: int, db: Session = Depends(get_db)):

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    if ticket.status != "EMITIDO":
        raise HTTPException(
            status_code=400,
            detail=f"No se puede iniciar un ticket en estado '{ticket.status}'"
        )

    now = datetime.utcnow()
    ticket.started_at       = now
    ticket.estimated_end_at = now + timedelta(minutes=ticket.duration_minutes)
    ticket.status           = "EN_JUEGO"
    db.commit()

    return {
        "message": "Juego iniciado",
        "ends_at": ticket.estimated_end_at
    }


# 3️⃣ FINALIZAR ticket — manual o cuando vence
@router.patch("/{ticket_id}/end", response_model=TicketEndResponse)
def end_ticket(ticket_id: int, db: Session = Depends(get_db)):

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    if ticket.status not in ("EN_JUEGO", "EMITIDO"):
        raise HTTPException(
            status_code=400,
            detail=f"No se puede finalizar un ticket en estado '{ticket.status}'"
        )

    ticket.ended_at = datetime.utcnow()
    ticket.status   = "FINALIZADO"
    db.commit()

    # Calcular minutos de espera solo si el niño llegó a jugar
    wait_minutes = None
    if ticket.started_at and ticket.emitted_at:
        diff = ticket.started_at - ticket.emitted_at
        wait_minutes = round(diff.total_seconds() / 60, 1)

    return {
        "message": "Ticket finalizado",
        "wait_minutes": wait_minutes
    }


# 4️⃣ LISTAR tickets activos — para el panel del operador
@router.get("/active", response_model=list[TicketResponse])
def list_active_tickets(db: Session = Depends(get_db)):
    return db.query(Ticket).filter(
        Ticket.status.in_(["EMITIDO", "EN_JUEGO"])
    ).order_by(Ticket.emitted_at.desc()).all()


# 5️⃣ MARCAR como vencido — para tickets que superaron el tiempo
@router.patch("/{ticket_id}/expire")
def expire_ticket(ticket_id: int, db: Session = Depends(get_db)):

    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    if ticket.status != "EN_JUEGO":
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden vencer tickets EN_JUEGO"
        )

    ticket.status = "VENCIDO"
    db.commit()

    return {"message": f"Ticket {ticket.code} marcado como vencido"}

# 6️⃣ HISTORIAL del día — para el resumen operativo
@router.get("/history/today")
def today_history(db: Session = Depends(get_db)):
    from datetime import date

    tickets = db.query(Ticket).filter(
        cast(Ticket.emitted_at, Date) == date.today(),
        Ticket.status.in_(["FINALIZADO", "VENCIDO"])
    ).order_by(Ticket.emitted_at.desc()).all()

    total_revenue = sum(float(t.price) for t in tickets)
    avg_wait = None

    waited = [
        (t.started_at - t.emitted_at).total_seconds() / 60
        for t in tickets
        if t.started_at and t.emitted_at
    ]
    if waited:
        avg_wait = round(sum(waited) / len(waited), 1)

    return {
        "tickets":       tickets,
        "total_tickets": len(tickets),
        "total_revenue": round(total_revenue, 2),
        "avg_wait_min":  avg_wait
    }

# 7️⃣ HISTORIAL por fecha — para el filtro del frontend
@router.get("/history")
def history_by_date(
    date: str = None,   # formato YYYY-MM-DD
    db: Session = Depends(get_db)
):
    from datetime import date as date_type, datetime

    target_date = date_type.fromisoformat(date) if date else date_type.today()

    tickets = db.query(Ticket).filter(
        cast(Ticket.emitted_at, Date) == target_date,
        Ticket.status.in_(["FINALIZADO", "VENCIDO"])
    ).order_by(Ticket.emitted_at.desc()).all()

    total_revenue = sum(float(t.price) for t in tickets)
    waited = [
        (t.started_at - t.emitted_at).total_seconds() / 60
        for t in tickets if t.started_at and t.emitted_at
    ]
    avg_wait = round(sum(waited) / len(waited), 1) if waited else None

    return {
        "tickets":       tickets,
        "total_tickets": len(tickets),
        "total_revenue": round(total_revenue, 2),
        "avg_wait_min":  avg_wait,
        "date":          str(target_date)
    }