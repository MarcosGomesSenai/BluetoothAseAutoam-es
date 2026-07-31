import serial
import time
from db import conectar_db

porta_serial = 'COM3'  # ou /dev/ttyUSB0 em Linux
baud_rate = 9600

def registrar_log(usuario_id, acao, origem="serial"):
    db = conectar_db()
    cursor = db.cursor()
    cursor.execute("INSERT INTO logs_acesso (usuario_id, acao, origem) VALUES (%s, %s, %s)",
                   (usuario_id, acao, origem))
    db.commit()
    cursor.close()
    db.close()

def escutar_serial():
    try:
        arduino = serial.Serial(porta_serial, baud_rate, timeout=1)
        print("Escutando porta serial...")
        while True:
            linha = arduino.readline().decode().strip()
            if linha:
                print(f"Recebido: {linha}")
                if "ACESSO_OK" in linha:
                    registrar_log(1, "Acesso autorizado via Arduino")
                elif "ACESSO_NEGADO" in linha:
                    registrar_log(1, "Acesso negado via Arduino")
    except Exception as e:
        print(f"Erro na porta serial: {e}")

if __name__ == "__main__":
    escutar_serial()
