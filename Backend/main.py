import psycopg2
from psycopg2 import pool
from config import load_config
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import time

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

connection_pool = None

@app.on_event("startup")
async def startup_event():
    global connection_pool
    config = load_config()
    connection_pool = pool.SimpleConnectionPool(
        1,
        20,
        host=config.get('host'),
        database=config.get('database'),
        user=config.get('user'),
        password=config.get('password'),
        port=config.get('port', 5432)
    )
    print(f"Connection pool creado con {connection_pool.minconn}-{connection_pool.maxconn} conexiones")

@app.on_event("shutdown")
async def shutdown_event():
    global connection_pool
    if connection_pool:
        connection_pool.closeall()
        print("Connection pool cerrado")

def get_conn():
    """Obtiene una conexión del pool"""
    return connection_pool.getconn()

def return_conn(conn):
    """Devuelve la conexión al pool"""
    connection_pool.putconn(conn)


# ==================================================
#  ENDPOINTS: LUGARES
# ==================================================

@app.get("/api/lugares")
def get_lugares():
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT id, nombre, direccion, latitud, longitud, gmapslink FROM lugar ORDER BY id DESC")
        rows = cur.fetchall()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"GET /api/lugares tomó: {elapsed:.2f} ms")
        
        return [{"id": r[0], "nombre": r[1], "direccion": r[2],
                "lat": float(r[3]) if r[3] else None,
                "lng": float(r[4]) if r[4] else None,
                "gmapslink": r[5]} for r in rows]
    finally:
        cur.close()
        return_conn(conn)

@app.post("/api/lugares")
def crear_lugar(lugar: dict):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute(
            """INSERT INTO lugar (nombre, direccion, latitud, longitud, gmapslink) 
               VALUES (%s, %s, %s, %s, %s) 
               RETURNING id, nombre, direccion, latitud, longitud, gmapslink""", 
            (lugar["nombre"], lugar.get("direccion"), lugar.get("lat"), 
             lugar.get("lng"), lugar.get("gmapslink"))
        )
        row = cur.fetchone()
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"POST /api/lugares tomó: {elapsed:.2f} ms")
        
        return {
            "id": row[0],
            "nombre": row[1],
            "direccion": row[2],
            "lat": float(row[3]) if row[3] else None,
            "lng": float(row[4]) if row[4] else None,
            "gmapslink": row[5]
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)

@app.put("/api/lugares/{lugar_id}")
def actualizar_lugar(lugar_id: int, lugar: dict):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        print(f"Recibiendo actualización para ID {lugar_id}: {lugar}")
        
        cur.execute(
            """UPDATE lugar 
               SET nombre = %s, direccion = %s, latitud = %s, longitud = %s, gmapslink = %s
               WHERE id = %s
               RETURNING id, nombre, direccion, latitud, longitud, gmapslink""", 
            (lugar["nombre"], lugar.get("direccion"), lugar.get("lat"), 
             lugar.get("lng"), lugar.get("gmapslink"), lugar_id)
        )
        row = cur.fetchone()
        conn.commit()
        
        if not row:
            raise HTTPException(status_code=404, detail="Lugar no encontrado")
        
        elapsed = (time.time() - start_time) * 1000
        print(f"PUT /api/lugares/{lugar_id} tomó: {elapsed:.2f} ms")
        
        return {
            "id": row[0],
            "nombre": row[1],
            "direccion": row[2],
            "lat": float(row[3]) if row[3] else None,
            "lng": float(row[4]) if row[4] else None,
            "gmapslink": row[5]
        }
    except Exception as e:
        conn.rollback()
        print(f"Error en actualización: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)

@app.delete("/api/lugares/{lugar_id}")
def eliminar_lugar(lugar_id: int):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute("DELETE FROM lugar WHERE id = %s RETURNING id", (lugar_id,))
        eliminado = cur.fetchone()
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"DELETE /api/lugares/{lugar_id} tomó: {elapsed:.2f} ms")
        
        if eliminado:
            return {"mensaje": "Lugar eliminado", "id": lugar_id}
        else:
            raise HTTPException(status_code=404, detail="Lugar no encontrado")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)


# ==================================================
#  ENDPOINTS: TIPO EVENTO
# ==================================================

@app.get("/api/tipo-evento")
def get_tipos():
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT id, nombre FROM tipo_evento ORDER BY id")
        rows = cur.fetchall()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"GET /api/tipo-evento tomó: {elapsed:.2f} ms")
        
        return [{"id": r[0], "nombre": r[1]} for r in rows]
    finally:
        cur.close()
        return_conn(conn)

@app.post("/api/tipo-evento")
def crear_tipo(tipo: dict):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute(
            "INSERT INTO tipo_evento (nombre) VALUES (%s) RETURNING id",
            (tipo["nombre"],)
        )
        nuevo_id = cur.fetchone()[0]
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"POST /api/tipo-evento tomó: {elapsed:.2f} ms")
        
        return {"mensaje": "Tipo creado", "id": nuevo_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)

@app.put("/api/tipo-evento/{tipo_id}")
def actualizar_tipo(tipo_id: int, tipo: dict):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        print(f"Recibiendo actualización para ID {tipo_id}: {tipo}")
        
        cur.execute(
            """UPDATE tipo_evento 
               SET nombre = %s 
               WHERE id = %s
               RETURNING id, nombre""", 
            (tipo["nombre"], tipo_id)  # CORREGIDO: antes era tipo_id_id
        )
        row = cur.fetchone()
        conn.commit()
        
        if not row:
            raise HTTPException(status_code=404, detail="Tipo no encontrado")
        
        elapsed = (time.time() - start_time) * 1000
        print(f"PUT /api/tipo-evento/{tipo_id} tomó: {elapsed:.2f} ms")
        
        return {
            "id": row[0],
            "nombre": row[1],
        }
    except Exception as e:
        conn.rollback()
        print(f"Error en actualización: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)

@app.delete("/api/tipo-evento/{tipo_id}")
def eliminar_tipo(tipo_id: int):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute("DELETE FROM tipo_evento WHERE id = %s RETURNING id", (tipo_id,))
        eliminado = cur.fetchone()
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"DELETE /api/tipo-evento/{tipo_id} tomó: {elapsed:.2f} ms")
        
        if eliminado:
            return {"mensaje": "Tipo eliminado", "id": tipo_id}
        else:
            raise HTTPException(status_code=404, detail="Tipo no encontrado")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)


# ==================================================
#  ENDPOINTS: ASISTENTES
# ==================================================

@app.get("/api/asistentes")
def get_asistentes():
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute("SELECT id, nombre, sexo, email, telefono, seccion FROM asistente ORDER BY id")
        rows = cur.fetchall()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"GET /api/asistentes tomó: {elapsed:.2f} ms")
        
        return [{"id": r[0], "nombre": r[1], "sexo": r[2], 
                "email": r[3], "telefono": r[4], "seccion": r[5]} for r in rows]
    finally:
        cur.close()
        return_conn(conn)

@app.post("/api/asistentes")
def crear_asistente(a: dict):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute(
            """INSERT INTO asistente (nombre, sexo, fecha_nacimiento, email, telefono, seccion)
               VALUES (%s, %s, %s, %s, %s, %s) 
               RETURNING id""",
            (a["nombre"], a.get("sexo"), a.get("fecha_nacimiento"),
             a["email"], a.get("telefono"), a.get("seccion"))
        )
        nuevo_id = cur.fetchone()[0]
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"POST /api/asistentes tomó: {elapsed:.2f} ms")
        
        return {"mensaje": "Asistente creado", "id": nuevo_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)

@app.put("/api/asistentes/{asistente_id}")
def actualizar_asistente(asistente_id: int, a: dict):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute(
            """UPDATE asistente 
               SET nombre = %s, sexo = %s, fecha_nacimiento = %s, 
                   email = %s, telefono = %s, seccion = %s
               WHERE id = %s
               RETURNING id""",
            (a["nombre"], a.get("sexo"), a.get("fecha_nacimiento"),
             a["email"], a.get("telefono"), a.get("seccion"), asistente_id)
        )
        row = cur.fetchone()
        conn.commit()
        
        if not row:
            raise HTTPException(status_code=404, detail="Asistente no encontrado")
        
        elapsed = (time.time() - start_time) * 1000
        print(f"PUT /api/asistentes/{asistente_id} tomó: {elapsed:.2f} ms")
        
        return {"mensaje": "Asistente actualizado", "id": asistente_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)

@app.delete("/api/asistentes/{asistente_id}")
def eliminar_asistente(asistente_id: int):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute("DELETE FROM asistente WHERE id = %s RETURNING id", (asistente_id,))
        eliminado = cur.fetchone()
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"DELETE /api/asistentes/{asistente_id} tomó: {elapsed:.2f} ms")
        
        if eliminado:
            return {"mensaje": "Asistente eliminado", "id": asistente_id}
        else:
            raise HTTPException(status_code=404, detail="Asistente no encontrado")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)


# ==================================================
#  ENDPOINTS: EVENTOS
# ==================================================

@app.get("/api/eventos")
def get_eventos():
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT e.id, e.nombre, e.fecha, t.nombre AS tipo, e.created_at
            FROM evento e
            LEFT JOIN tipo_evento t ON e.tipo_id = t.id
            ORDER BY e.id
        """)
        rows = cur.fetchall()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"GET /api/eventos tomó: {elapsed:.2f} ms")
        
        return [{"id": r[0], "nombre": r[1], "fecha": str(r[2]),
                "tipo": r[3], "created_at": str(r[4])} for r in rows]
    finally:
        cur.close()
        return_conn(conn)

@app.post("/api/eventos")
def crear_evento(evento: dict):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute(
            "INSERT INTO evento (nombre, fecha, tipo_id) VALUES (%s, %s, %s) RETURNING id",
            (evento["nombre"], evento["fecha"], evento.get("tipo_id"))
        )
        nuevo_id = cur.fetchone()[0]
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"POST /api/eventos tomó: {elapsed:.2f} ms")
        
        return {"mensaje": "Evento creado", "id": nuevo_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)

@app.put("/api/eventos/{evento_id}")
def actualizar_evento(evento_id: int, evento: dict):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute(
            """UPDATE evento 
               SET nombre = %s, fecha = %s, tipo_id = %s
               WHERE id = %s
               RETURNING id""",
            (evento["nombre"], evento["fecha"], evento.get("tipo_id"), evento_id)
        )
        row = cur.fetchone()
        conn.commit()
        
        if not row:
            raise HTTPException(status_code=404, detail="Evento no encontrado")
        
        elapsed = (time.time() - start_time) * 1000
        print(f"PUT /api/eventos/{evento_id} tomó: {elapsed:.2f} ms")
        
        return {"mensaje": "Evento actualizado", "id": evento_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)

@app.delete("/api/eventos/{evento_id}")
def eliminar_evento(evento_id: int):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute("DELETE FROM evento WHERE id = %s RETURNING id", (evento_id,))
        eliminado = cur.fetchone()
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"DELETE /api/eventos/{evento_id} tomó: {elapsed:.2f} ms")
        
        if eliminado:
            return {"mensaje": "Evento eliminado", "id": evento_id}
        else:
            raise HTTPException(status_code=404, detail="Evento no encontrado")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)


# ==================================================
#  ENDPOINTS: EVENTO_LUGAR
# ==================================================

@app.get("/api/evento-lugar")
def get_evento_lugar():
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT el.id, e.nombre AS evento, l.nombre AS lugar,
                   l.latitud, l.longitud, el.fecha_evento, el.hora_inicio
            FROM evento_lugar el
            JOIN evento e ON el.evento_id = e.id
            JOIN lugar l ON el.lugar_id = l.id
            ORDER BY el.id
        """)
        rows = cur.fetchall()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"GET /api/evento-lugar tomó: {elapsed:.2f} ms")
        
        return [{"id": r[0], "evento": r[1], "lugar": r[2],
                "lat": float(r[3]) if r[3] else None,
                "lng": float(r[4]) if r[4] else None,
                "fecha": str(r[5]), "hora": str(r[6]) if r[6] else None} for r in rows]
    finally:
        cur.close()
        return_conn(conn)

@app.post("/api/evento-lugar")
def crear_evento_lugar(el: dict):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute(
            """INSERT INTO evento_lugar (evento_id, lugar_id, fecha_evento, hora_inicio)
               VALUES (%s, %s, %s, %s) 
               RETURNING id""",
            (el["evento_id"], el["lugar_id"], el["fecha_evento"], el.get("hora_inicio"))
        )
        nuevo_id = cur.fetchone()[0]
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"POST /api/evento-lugar tomó: {elapsed:.2f} ms")
        
        return {"mensaje": "Evento-Lugar creado", "id": nuevo_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)

@app.put("/api/evento-lugar/{evento_lugar_id}")
def actualizar_evento_lugar(evento_lugar_id: int, el: dict):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute(
            """UPDATE evento_lugar 
               SET evento_id = %s, lugar_id = %s, fecha_evento = %s, hora_inicio = %s
               WHERE id = %s
               RETURNING id""",
            (el["evento_id"], el["lugar_id"], el["fecha_evento"], 
             el.get("hora_inicio"), evento_lugar_id)
        )
        row = cur.fetchone()
        conn.commit()
        
        if not row:
            raise HTTPException(status_code=404, detail="Evento-Lugar no encontrado")
        
        elapsed = (time.time() - start_time) * 1000
        print(f"PUT /api/evento-lugar/{evento_lugar_id} tomó: {elapsed:.2f} ms")
        
        return {"mensaje": "Evento-Lugar actualizado", "id": evento_lugar_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)

@app.delete("/api/evento-lugar/{evento_lugar_id}")
def eliminar_evento_lugar(evento_lugar_id: int):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute("DELETE FROM evento_lugar WHERE id = %s RETURNING id", (evento_lugar_id,))
        eliminado = cur.fetchone()
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"DELETE /api/evento-lugar/{evento_lugar_id} tomó: {elapsed:.2f} ms")
        
        if eliminado:
            return {"mensaje": "Evento-Lugar eliminado", "id": evento_lugar_id}
        else:
            raise HTTPException(status_code=404, detail="Evento-Lugar no encontrado")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)


# ==================================================
#  ENDPOINTS: EVENTO_ASISTENTE
# ==================================================

@app.get("/api/evento-asistente")
def get_evento_asistente():
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT ea.id, a.nombre AS asistente, e.nombre AS evento, l.nombre AS lugar
            FROM evento_asistente ea
            JOIN asistente a ON ea.asistente_id = a.id
            JOIN evento_lugar el ON ea.evento_lugar_id = el.id
            JOIN evento e ON el.evento_id = e.id
            JOIN lugar l ON el.lugar_id = l.id
            ORDER BY ea.id
        """)
        rows = cur.fetchall()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"GET /api/evento-asistente tomó: {elapsed:.2f} ms")
        
        return [{"id": r[0], "asistente": r[1], "evento": r[2], "lugar": r[3]} for r in rows]
    finally:
        cur.close()
        return_conn(conn)

@app.post("/api/evento-asistente")
def registrar_asistente(ea: dict):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute(
            """INSERT INTO evento_asistente (evento_lugar_id, asistente_id)
               VALUES (%s, %s) 
               RETURNING id""",
            (ea["evento_lugar_id"], ea["asistente_id"])
        )
        nuevo_id = cur.fetchone()[0]
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"POST /api/evento-asistente tomó: {elapsed:.2f} ms")
        
        return {"mensaje": "Asistente registrado al evento", "id": nuevo_id}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)

@app.delete("/api/evento-asistente/{evento_asistente_id}")
def eliminar_asistente_evento(evento_asistente_id: int):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute("DELETE FROM evento_asistente WHERE id = %s RETURNING id", (evento_asistente_id,))
        eliminado = cur.fetchone()
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"DELETE /api/evento-asistente/{evento_asistente_id} tomó: {elapsed:.2f} ms")
        
        if eliminado:
            return {"mensaje": "Asistente removido del evento", "id": evento_asistente_id}
        else:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)