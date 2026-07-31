from flask import Flask
from flask_socketio import SocketIO
import serial

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins='*')
ser = serial.Serial('COM3', 9600)

@socketio.on('comando')
def handle_comando(msg):
    ser.write(msg.encode())

@socketio.on('connect')
def connect():
    print('Cliente conectado')

if __name__ == '__main__':
    socketio.run(app, port=5000)
