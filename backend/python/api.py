from flask import Flask, request, jsonify
import serial
from db import conectar_db

app = Flask(__name__)

# Porta serial do Arduino
porta_serial = 'COM3'  # ou '/dev/ttyUSB0'
baud_rate = 9600

def enviar_para_arduino(mensagem):
    try:
        with serial.Serial(porta_serial, baud_rate, timeout=1) as arduino:
            arduino.write((mensagem + '\n').encode())
    except Exception as e:
        print(f"Erro ao enviar para Arduino: {e}")

@app.route("/api/abrir", methods=["POST"])
def abrir_portao():
    usuario_id = request.json.get("usuario_id")
    enviar_para_arduino("ABRIR_PORTAO")

    db = conectar_db()
    cursor = db.cursor()
    cursor.execute("INSERT INTO logs_acesso (usuario_id, acao, origem) VALUES (%s, %s, %s)",
                   (usuario_id, "Portão aberto via API", "web"))
    db.commit()
    cursor.close()
    db.close()

    return jsonify({"status": "Portão aberto com sucesso"})

@app.route("/api/logs", methods=["GET"])
def listar_logs():
    db = conectar_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM logs_acesso ORDER BY data_hora DESC LIMIT 20")
    logs = cursor.fetchall()
    cursor.close()
    db.close()
    return jsonify(logs)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
