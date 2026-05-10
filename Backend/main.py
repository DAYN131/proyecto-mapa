import psycopg2
from config import load_config
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://127.0.0.1:4200"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600 
)

def get_conn():
    return psycopg2.connect(**load_config())


# ─────────────────────────────────────────
#  TIPO EVENTO
# ─────────────────────────────────────────
@app.get("/api/tipo-evento")
def get_tipos():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, nombre FROM tipo_evento")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [{"id": r[0], "nombre": r[1]} for r in rows]

@app.post("/api/tipo-evento")
def crear_tipo(tipo: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO tipo_evento (nombre) VALUES (%s) RETURNING id",
        (tipo["nombre"])
    )
    nuevo_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return {"mensaje": "Tipo creado", "id": nuevo_id}


# ─────────────────────────────────────────
#  EVENTOS
# ─────────────────────────────────────────
@app.get("/api/eventos")
def get_eventos():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT e.id, e.nombre, e.fecha, t.nombre AS tipo, e.created_at
        FROM evento e
        LEFT JOIN tipo_evento t ON e.tipo_id = t.id
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [{"id": r[0], "nombre": r[1], "fecha": str(r[2]),
            "tipo": r[3], "created_at": str(r[4])} for r in rows]

@app.post("/api/eventos")
def crear_evento(evento: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO evento (nombre, fecha, tipo_id) VALUES (%s, %s, %s) RETURNING id",
        (evento["nombre"], evento["fecha"], evento.get("tipo_id"))
    )
    nuevo_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return {"mensaje": "Evento creado", "id": nuevo_id}


# ─────────────────────────────────────────
#  LUGARES
# ─────────────────────────────────────────
@app.get("/api/lugares")
def get_lugares():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, nombre, colonia, latitud, longitud FROM lugar")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [{"id": r[0], "nombre": r[1], "colonia": r[2],
            "lat": float(r[3]) if r[3] else None,
            "lng": float(r[4]) if r[4] else None} for r in rows]

@app.post("/api/lugares")
def crear_lugar(lugar: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO lugar (nombre, colonia, latitud, longitud) VALUES (%s, %s, %s, %s) RETURNING id",
        (lugar["nombre"], lugar.get("colonia"), lugar.get("lat"), lugar.get("lng"))
    )
    nuevo_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return {"mensaje": "Lugar creado", "id": nuevo_id}


# ─────────────────────────────────────────
#  ASISTENTES
# ─────────────────────────────────────────
@app.get("/api/asistentes")
def get_asistentes():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, nombre, sexo, email, telefono, seccion FROM asistente")
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [{"id": r[0], "nombre": r[1], "sexo": r[2],"email": r[3], "telefono": r[4], "seccion": r[5]} for r in rows]

@app.post("/api/asistentes")
def crear_asistente(a: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO asistente (nombre, sexo, fecha_nacimiento, email, telefono, seccion)
        VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
        (a["nombre"], a.get("sexo"), a.get("fecha_nacimiento"),
        a["email"], a.get("telefono"), a.get("seccion"))
    )
    nuevo_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return {"mensaje": "Asistente creado", "id": nuevo_id}


# ─────────────────────────────────────────
#  EVENTO_LUGAR 
# ─────────────────────────────────────────
@app.get("/api/evento-lugar")
def get_evento_lugar():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT el.id, e.nombre AS evento, l.nombre AS lugar,
        l.latitud, l.longitud, el.fecha_evento, el.hora_inicio
        FROM evento_lugar el
        JOIN evento e ON el.evento_id = e.id
        JOIN lugar  l ON el.lugar_id  = l.id
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [{"id": r[0], "evento": r[1], "lugar": r[2],
            "lat": float(r[3]) if r[3] else None,
            "lng": float(r[4]) if r[4] else None,
            "fecha": str(r[5]), "hora": str(r[6]) if r[6] else None} for r in rows]

@app.post("/api/evento-lugar")
def crear_evento_lugar(el: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO evento_lugar (evento_id, lugar_id, fecha_evento, hora_inicio)
        VALUES (%s, %s, %s, %s) RETURNING id""",
        (el["evento_id"], el["lugar_id"], el["fecha_evento"], el.get("hora_inicio"))
    )
    nuevo_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return {"mensaje": "Evento-Lugar creado", "id": nuevo_id}


# ─────────────────────────────────────────
#  EVENTO_ASISTENTE 
# ─────────────────────────────────────────
@app.get("/api/evento-asistente")
def get_evento_asistente():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT ea.id, a.nombre AS asistente, e.nombre AS evento, l.nombre AS lugar
        FROM evento_asistente ea
        JOIN asistente   a  ON ea.asistente_id    = a.id
        JOIN evento_lugar el ON ea.evento_lugar_id = el.id
        JOIN evento      e  ON el.evento_id        = e.id
        JOIN lugar       l  ON el.lugar_id         = l.id
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [{"id": r[0], "asistente": r[1], "evento": r[2], "lugar": r[3]} for r in rows]

@app.post("/api/evento-asistente")
def registrar_asistente(ea: dict):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO evento_asistente (evento_lugar_id, asistente_id)
        VALUES (%s, %s) RETURNING id""",
        (ea["evento_lugar_id"], ea["asistente_id"])
    )
    nuevo_id = cur.fetchone()[0]
    conn.commit(); cur.close(); conn.close()
    return {"mensaje": "Asistente registrado al evento", "id": nuevo_id}