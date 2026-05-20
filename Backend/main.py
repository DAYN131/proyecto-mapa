import psycopg2
from psycopg2 import pool
from config import load_config
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import time
from fastapi.responses import FileResponse
import os
import json

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
#  ENDPOINTS: DASHBOARD
# ==================================================

@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        stats = {}
        
        # 1. Total de eventos
        cur.execute("SELECT COUNT(*) FROM evento")
        stats["total_eventos"] = cur.fetchone()[0]
        
        # 2. Total de asistentes únicos
        cur.execute("SELECT COUNT(*) FROM asistente")
        stats["total_asistentes"] = cur.fetchone()[0]
        
        # 3. Total de lugares
        cur.execute("SELECT COUNT(*) FROM lugar")
        stats["total_lugares"] = cur.fetchone()[0]
        
        # 4. Total de registros (asistentes en eventos)
        cur.execute("SELECT COUNT(*) FROM evento_asistente")
        stats["total_registros"] = cur.fetchone()[0]
        
        # 5. Eventos por tipo (para gráfica de barras)
        cur.execute("""
            SELECT 
                COALESCE(t.nombre, 'Sin tipo') as tipo,
                COUNT(e.id) as total
            FROM evento e
            LEFT JOIN tipo_evento t ON e.tipo_id = t.id
            GROUP BY t.nombre
            ORDER BY total DESC
        """)
        stats["eventos_por_tipo"] = [{"tipo": r[0], "total": r[1]} for r in cur.fetchall()]
        
        # 6. Top 5 eventos con más asistentes
        cur.execute("""
            SELECT 
                e.nombre,
                COUNT(DISTINCT ea.asistente_id) as asistentes
            FROM evento e
            JOIN evento_asistente ea ON ea.evento_id = e.id
            GROUP BY e.id, e.nombre
            ORDER BY asistentes DESC
            LIMIT 5
        """)
        stats["top_eventos"] = [{"nombre": r[0], "asistentes": r[1]} for r in cur.fetchall()]
        
        # 7. Top 5 lugares con más eventos
        cur.execute("""
            SELECT 
                l.nombre,
                COUNT(el.evento_id) as total_eventos
            FROM lugar l
            JOIN evento_lugar el ON el.lugar_id = l.id
            GROUP BY l.id, l.nombre
            ORDER BY total_eventos DESC
            LIMIT 5
        """)
        stats["top_lugares"] = [{"nombre": r[0], "eventos": r[1]} for r in cur.fetchall()]
        
        # 8. Sección con más participación cultural
        cur.execute("""
            SELECT 
                a.seccion,
                COUNT(DISTINCT a.id) as total_asistentes
            FROM asistente a
            JOIN evento_asistente ea ON ea.asistente_id = a.id
            WHERE a.seccion IS NOT NULL AND a.seccion > 0
            GROUP BY a.seccion
            ORDER BY total_asistentes DESC
            LIMIT 1
        """)
        top_seccion = cur.fetchone()
        if top_seccion:
            stats["seccion_top"] = {
                "seccion": str(top_seccion[0]),
                "asistentes": top_seccion[1]
            }
        else:
            stats["seccion_top"] = None
        
        # 9. Asistentes por mes (últimos 6 meses)
        cur.execute("""
            SELECT 
                TO_CHAR(DATE_TRUNC('month', ea.created_at), 'YYYY-MM') as mes,
                COUNT(DISTINCT ea.asistente_id) as asistentes
            FROM evento_asistente ea
            WHERE ea.created_at >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY DATE_TRUNC('month', ea.created_at)
            ORDER BY mes DESC
        """)
        stats["asistentes_por_mes"] = [{"mes": r[0], "asistentes": r[1]} for r in cur.fetchall()]
        
        # 10. Porcentaje de participación (asistentes únicos vs población estimada)
        cur.execute("SELECT COUNT(DISTINCT asistente_id) FROM evento_asistente")
        total_participantes = cur.fetchone()[0]
        stats["tasa_participacion"] = round((total_participantes / stats["total_asistentes"] * 100), 1) if stats["total_asistentes"] > 0 else 0
        
        elapsed = (time.time() - start_time) * 1000
        print(f" GET /api/dashboard/stats tomó: {elapsed:.2f} ms")
        
        return stats
        
    except Exception as e:
        print(f" Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)


@app.get("/api/secciones-geojson")
async def get_secciones_geojson():
    return FileResponse("SECCIONES.geojson", media_type="application/json")


@app.get("/api/secciones-con-colores")
def get_secciones_con_colores():
    conn = get_conn()
    cur = conn.cursor()
    try:
        # 1. Obtener asistentes por sección desde la base de datos
        cur.execute("""
            WITH asistentes_unicos_por_seccion AS (
                SELECT 
                    a.seccion as seccion_asistente,
                    COUNT(DISTINCT a.id) as total_asistentes
                FROM asistente a
                JOIN evento_asistente ea ON ea.asistente_id = a.id
                WHERE a.seccion IS NOT NULL AND a.seccion > 0
                GROUP BY a.seccion
            )
            SELECT 
                seccion_asistente,
                total_asistentes
            FROM asistentes_unicos_por_seccion
            ORDER BY seccion_asistente
        """)
        asistentes_por_seccion = {}
        for row in cur.fetchall():
            asistentes_por_seccion[str(row[0])] = row[1]
        
        # 2. Cargar las secciones desde el GeoJSON
        geojson_path = "SECCIONES.geojson"
        if not os.path.exists(geojson_path):
            raise HTTPException(status_code=404, detail="Archivo GeoJSON no encontrado")
        
        with open(geojson_path, 'r', encoding='utf-8') as f:
            geojson = json.load(f)
        
        # 3. Procesar cada sección del GeoJSON
        resultado = []
        for feature in geojson.get('features', []):
            properties = feature.get('properties', {})
            seccion = str(properties.get('seccion', ''))
            
            if not seccion:
                continue
            
            asistentes = asistentes_por_seccion.get(seccion, 0)
            
        # Determinar color y nivel según asistentes
      
            if asistentes == 0:
                color = '#90a4ae'      # Gris azulado (frío, vacío)
                nivel = 'Sin participación'
            elif asistentes < 3:
                color = '#42a5f5'      # Azul
                nivel = 'Muy baja participación'
            elif asistentes < 10:
                color = '#26c6da'      # Cian
                nivel = 'Baja participación'
            elif asistentes < 25:
                color = '#ffca28'      # Amarillo cálido
                nivel = 'Participación media'
            elif asistentes < 50:
                color = '#ff7043'      # Naranja
                nivel = 'Alta participación'
            else:
                color = '#e53935'      # Rojo intenso
                nivel = 'Muy alta participación'

            resultado.append({
                "seccion": seccion,
                "asistentes": asistentes,
                "color": color,
                "nivel": nivel
            })
        
        print(f" Secciones procesadas: {len(resultado)}")
        return resultado
        
    except Exception as e:
        print(f" Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)

@app.get("/api/tipos-para-filtros")
def get_tipos_para_filtros():
    conn = get_conn()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT DISTINCT LOWER(t.nombre) as tipo, t.nombre as nombre_original
            FROM tipo_evento t
            JOIN evento e ON e.tipo_id = t.id
            ORDER BY t.nombre
        """)
        rows = cur.fetchall()
        return [{"valor": r[0], "nombre": r[1]} for r in rows]
    finally:
        cur.close()
        return_conn(conn)

        
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
        # Verificar si el lugar está siendo usado
        cur.execute("""
            SELECT COUNT(*) as total, 
                   STRING_AGG(DISTINCT e.nombre, ', ') as eventos
            FROM evento_lugar el
            JOIN evento e ON el.evento_id = e.id
            WHERE el.lugar_id = %s
        """, (lugar_id,))
        
        result = cur.fetchone()
        total_usos = result[0]
        eventos_nombres = result[1] if result[1] else ""
        
        if total_usos > 0:
            raise HTTPException(
                status_code=400, 
                detail=f" No se puede eliminar el lugar porque está asociado a {total_usos} evento(s): {eventos_nombres}. Primero elimina o reasigna esos eventos."
            )
        
        cur.execute("DELETE FROM lugar WHERE id = %s RETURNING id, nombre", (lugar_id,))
        eliminado = cur.fetchone()
        conn.commit()
        
        if eliminado:
            return {
                "mensaje": f" Lugar '{eliminado[1]}' eliminado exitosamente",
                "id": eliminado[0]
            }
        else:
            raise HTTPException(status_code=404, detail="Lugar no encontrado")
    except HTTPException:
        raise
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
        # 1. Verificar si el tipo existe
        cur.execute("SELECT id, nombre FROM tipo_evento WHERE id = %s", (tipo_id,))
        tipo = cur.fetchone()
        if not tipo:
            raise HTTPException(status_code=404, detail="❌ Tipo de evento no encontrado")
        
        # 2. Verificar si hay eventos usando este tipo
        cur.execute("""
            SELECT COUNT(*) as total, 
                   STRING_AGG(nombre, ', ' LIMIT 5) as eventos
            FROM evento 
            WHERE tipo_id = %s
        """, (tipo_id,))
        
        result = cur.fetchone()
        eventos_count = result[0]
        eventos_nombres = result[1] if result[1] else ""
        
        # 3. Si tiene eventos, bloquear eliminación
        if eventos_count > 0:
            mensaje_eventos = eventos_nombres
            if eventos_count > 5:
                mensaje_eventos += f"... y {eventos_count - 5} más"
            
            raise HTTPException(
                status_code=400, 
                detail=f" No se puede eliminar el tipo de evento '{tipo[1]}' porque está siendo usado por {eventos_count} evento(s): {mensaje_eventos}. Primero cambia el tipo de esos eventos o elimínalos."
            )
        
        # 4. Si no tiene eventos, proceder con eliminación
        cur.execute("DELETE FROM tipo_evento WHERE id = %s RETURNING id", (tipo_id,))
        eliminado = cur.fetchone()
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f" DELETE /api/tipo-evento/{tipo_id} tomó: {elapsed:.2f} ms")
        
        return {
            "mensaje": f" Tipo de evento '{tipo[1]}' eliminado exitosamente",
            "id": tipo_id
        }
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f" Error: {str(e)}")
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
        cur.execute("SELECT id, nombre, sexo, fecha_nacimiento, email, telefono, seccion FROM asistente ORDER BY id")
        rows = cur.fetchall()
        
        elapsed = (time.time() - start_time) * 1000
        print(f"GET /api/asistentes tomó: {elapsed:.2f} ms")
        
        return [{"id": r[0], "nombre": r[1], "sexo": r[2], "fecha_nacimiento": r[3], "email": r[4], "telefono": r[5], "seccion": r[6]} for r in rows]
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
        # Verificar si el asistente existe
        cur.execute("SELECT id, nombre FROM asistente WHERE id = %s", (asistente_id,))
        asistente = cur.fetchone()
        if not asistente:
            raise HTTPException(status_code=404, detail="❌ Asistente no encontrado")
        
        # Verificar si está registrado en eventos
        cur.execute("""
            SELECT COUNT(*) as total,
                   STRING_AGG(DISTINCT e.nombre, ', ' LIMIT 5) as eventos
            FROM evento_asistente ea
            JOIN evento_lugar el ON ea.evento_lugar_id = el.id
            JOIN evento e ON el.evento_id = e.id
            WHERE ea.asistente_id = %s
        """, (asistente_id,))
        
        result = cur.fetchone()
        eventos_count = result[0]
        eventos_nombres = result[1] if result[1] else ""
        
        if eventos_count > 0:
            mensaje_eventos = eventos_nombres
            if eventos_count > 5:
                mensaje_eventos += f"... y {eventos_count - 5} más"
            
            raise HTTPException(
                status_code=400,
                detail=f" No se puede eliminar al asistente '{asistente[1]}' porque está registrado en {eventos_count} evento(s): {mensaje_eventos}. Primero elimina sus registros de eventos."
            )
        
        cur.execute("DELETE FROM asistente WHERE id = %s RETURNING id", (asistente_id,))
        conn.commit()
        
        return {
            "mensaje": f" Asistente '{asistente[1]}' eliminado exitosamente",
            "id": asistente_id
        }
    except HTTPException:
        raise
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
            SELECT e.id, e.nombre, e.fecha, e.hora_inicio, t.nombre AS tipo,
                   l.id as lugar_id, l.nombre as lugar_nombre, l.direccion
            FROM evento e
            LEFT JOIN tipo_evento t ON e.tipo_id = t.id
            LEFT JOIN evento_lugar el ON e.id = el.evento_id
            LEFT JOIN lugar l ON el.lugar_id = l.id
            ORDER BY e.id DESC
        """)
        rows = cur.fetchall()
        
        print(f" GET /api/eventos tomó: {(time.time() - start_time) * 1000:.2f} ms")
        
        return [{
            "id": r[0],
            "nombre": r[1],
            "fecha": str(r[2]),
            "hora_inicio": str(r[3]) if r[3] else None,
            "tipo": r[4] if r[4] else "Sin tipo",
            "lugar_id": r[5],
            "lugar_nombre": r[6] if r[6] else "No asignado",
            "direccion": r[7] if r[7] else ""
        } for r in rows]
    finally:
        cur.close()
        return_conn(conn)

@app.post("/api/eventos")
def crear_evento(evento: dict):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        # Validaciones
        if not evento.get("lugar_id"):
            raise HTTPException(status_code=400, detail="❌ El lugar es obligatorio")
        
        # Insertar evento (con hora_inicio aquí mismo)
        cur.execute(
            """INSERT INTO evento (nombre, fecha, hora_inicio, tipo_id) 
               VALUES (%s, %s, %s, %s) 
               RETURNING id""",
            (evento["nombre"], evento["fecha"], 
             evento.get("hora_inicio"), evento.get("tipo_id"))
        )
        evento_id = cur.fetchone()[0]
        
        # Crear relación evento-lugar
        cur.execute(
            """INSERT INTO evento_lugar (evento_id, lugar_id)
               VALUES (%s, %s)""",
            (evento_id, evento["lugar_id"])
        )
        
        conn.commit()
        
        print(f" POST /api/eventos tomó: {(time.time() - start_time) * 1000:.2f} ms")
        
        return {
            "mensaje": " Evento creado exitosamente",
            "id": evento_id
        }
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
        # Actualizar evento
        cur.execute(
            """UPDATE evento 
               SET nombre = %s, fecha = %s, hora_inicio = %s, tipo_id = %s
               WHERE id = %s
               RETURNING id""",
            (evento["nombre"], evento["fecha"], 
             evento.get("hora_inicio"), evento.get("tipo_id"), evento_id)
        )
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Evento no encontrado")
        
        # Actualizar relación evento-lugar
        if evento.get("lugar_id"):
            cur.execute(
                """DELETE FROM evento_lugar WHERE evento_id = %s""",
                (evento_id,)
            )
            cur.execute(
                """INSERT INTO evento_lugar (evento_id, lugar_id)
                   VALUES (%s, %s)""",
                (evento_id, evento["lugar_id"])
            )
        
        conn.commit()
        
        print(f" PUT /api/eventos/{evento_id} tomó: {(time.time() - start_time) * 1000:.2f} ms")
        
        return {"mensaje": " Evento actualizado", "id": evento_id}
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
        # Verificar si tiene asistentes
        cur.execute(
            "SELECT COUNT(*) FROM evento_asistente WHERE evento_id = %s",
            (evento_id,)
        )
        asistentes_count = cur.fetchone()[0]
        
        if asistentes_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f" No se puede eliminar: tiene {asistentes_count} asistente(s) registrado(s)"
            )
        
        # Eliminar (ON DELETE CASCADE se encarga de evento_lugar)
        cur.execute("DELETE FROM evento WHERE id = %s RETURNING id", (evento_id,))
        eliminado = cur.fetchone()
        conn.commit()
        
        if not eliminado:
            raise HTTPException(status_code=404, detail="Evento no encontrado")
        
        print(f"DELETE /api/eventos/{evento_id} tomó: {(time.time() - start_time) * 1000:.2f} ms")
        
        return {"mensaje": " Evento eliminado", "id": evento_id}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)

@app.get("/api/eventos/{evento_id}")
def get_evento(evento_id: int):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT e.id, e.nombre, e.fecha, e.hora_inicio, e.tipo_id, t.nombre AS tipo,
                   l.id as lugar_id, l.nombre as lugar_nombre, l.direccion
            FROM evento e
            LEFT JOIN tipo_evento t ON e.tipo_id = t.id
            LEFT JOIN evento_lugar el ON e.id = el.evento_id
            LEFT JOIN lugar l ON el.lugar_id = l.id
            WHERE e.id = %s
        """, (evento_id,))
        
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Evento no encontrado")
        
        return {
            "id": row[0],
            "nombre": row[1],
            "fecha": str(row[2]),
            "hora_inicio": str(row[3]) if row[3] else None,
            "tipo_id": row[4],
            "tipo": row[5] if row[5] else "Sin tipo",
            "lugar_id": row[6],
            "lugar_nombre": row[7] if row[7] else "No asignado",
            "direccion": row[8] if row[8] else ""
        }
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
        # Consulta que devuelve TODOS los campos que espera el frontend
        cur.execute("""
            SELECT 
                ea.id,
                a.nombre AS asistente,
                a.email AS asistente_email,
                a.telefono AS asistente_telefono,
                a.seccion AS asistente_seccion,
                e.nombre AS evento,
                e.fecha AS fecha_evento,
                ea.created_at AS fecha_registro
            FROM evento_asistente ea
            JOIN asistente a ON ea.asistente_id = a.id
            JOIN evento e ON ea.evento_id = e.id
            ORDER BY ea.id DESC
        """)
        rows = cur.fetchall()
        
        print(f" Se encontraron {len(rows)} registros")
        
        elapsed = (time.time() - start_time) * 1000
        print(f" GET /api/evento-asistente tomó: {elapsed:.2f} ms")
        
        # Formatear la respuesta como espera el frontend
        resultados = []
        for r in rows:
            resultados.append({
                "id": r[0],
                "asistente": r[1],
                "asistente_email": r[2],
                "asistente_telefono": str(r[3]) if r[3] else None,
                "asistente_seccion": str(r[4]) if r[4] else None,
                "evento": r[5],
                "fecha_evento": str(r[6]) if r[6] else None,
                "fecha_registro": str(r[7]) if r[7] else None,
                "lugar": "Por definir"  # Temporal
            })
        
        print(f" Enviando {len(resultados)} registros al frontend")
        return resultados
        
    except Exception as e:
        print(f" Error en get_evento_asistente: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)

@app.post("/api/evento-asistente")
def registrar_asistente(ea: dict):
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        print(f" Datos recibidos: {ea}")
        
        # Validar datos requeridos
        if not ea.get("asistente_id") or not ea.get("evento_id"):
            raise HTTPException(
                status_code=400, 
                detail=" Faltan datos: asistente_id y evento_id son obligatorios"
            )
        
        # Verificar que el asistente existe
        cur.execute("SELECT id, nombre FROM asistente WHERE id = %s", (ea["asistente_id"],))
        asistente = cur.fetchone()
        if not asistente:
            raise HTTPException(status_code=404, detail=f" Asistente con ID {ea['asistente_id']} no existe")
        
        # Verificar que el evento existe
        cur.execute("SELECT id, nombre FROM evento WHERE id = %s", (ea["evento_id"],))
        evento = cur.fetchone()
        if not evento:
            raise HTTPException(status_code=404, detail=f" Evento con ID {ea['evento_id']} no existe")
        
        # Verificar que no esté duplicado (usando evento_id directamente)
        cur.execute("""
            SELECT id FROM evento_asistente 
            WHERE asistente_id = %s AND evento_id = %s
        """, (ea["asistente_id"], ea["evento_id"]))
        
        if cur.fetchone():
            raise HTTPException(
                status_code=400, 
                detail=f" El asistente '{asistente[1]}' ya está registrado en '{evento[1]}'"
            )
        
        # Insertar registro (usando evento_id directamente)
        cur.execute("""
            INSERT INTO evento_asistente (asistente_id, evento_id) 
            VALUES (%s, %s) 
            RETURNING id
        """, (ea["asistente_id"], ea["evento_id"]))
        
        nuevo_id = cur.fetchone()[0]
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f" POST /api/evento-asistente tomó: {elapsed:.2f} ms")
        
        return {
            "mensaje": f" {asistente[1]} registrado en {evento[1]}",
            "id": nuevo_id
        }
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f" Error: {str(e)}")
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
        # Verificar que existe y obtener datos
        cur.execute("""
            SELECT ea.id, a.nombre, e.nombre 
            FROM evento_asistente ea
            JOIN asistente a ON ea.asistente_id = a.id
            JOIN evento e ON ea.evento_id = e.id
            WHERE ea.id = %s
        """, (evento_asistente_id,))
        
        registro = cur.fetchone()
        if not registro:
            raise HTTPException(status_code=404, detail="❌ Registro no encontrado")
        
        # Eliminar
        cur.execute("DELETE FROM evento_asistente WHERE id = %s RETURNING id", (evento_asistente_id,))
        conn.commit()
        
        elapsed = (time.time() - start_time) * 1000
        print(f" DELETE /api/evento-asistente/{evento_asistente_id} tomó: {elapsed:.2f} ms")
        
        return {
            "mensaje": f" Asistente '{registro[1]}' removido del evento '{registro[2]}'",
            "id": evento_asistente_id
        }
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f" Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        return_conn(conn)


@app.get("/api/eventos-para-asistente")
def get_eventos_para_asistente():
    start_time = time.time()
    conn = get_conn()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT el.id, e.nombre AS evento, l.nombre AS lugar, 
                   el.fecha_evento, el.hora_inicio
            FROM evento_lugar el
            JOIN evento e ON el.evento_id = e.id
            JOIN lugar l ON el.lugar_id = l.id
            WHERE el.fecha_evento >= CURRENT_DATE
            ORDER BY el.fecha_evento ASC
        """)
        rows = cur.fetchall()
        
        return [{
            "id": r[0],
            "evento": r[1],
            "lugar": r[2],
            "fecha": str(r[3]) if r[3] else None,
            "hora": str(r[4]) if r[4] else None
        } for r in rows]
    finally:
        cur.close()
        return_conn(conn)