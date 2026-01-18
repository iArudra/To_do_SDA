from flask import Flask, request, jsonify
from flask_cors import CORS
from db import Database

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

db = Database()

@app.route('/')
def home():
    return jsonify({"status": "Backend is running!"}), 200

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    success = db.create_user(
        data.get('name'), 
        data.get('email'), 
        data.get('phone'), 
        data.get('password')
    )
    if success:
        return jsonify({"message": "User created successfully"}), 201
    return jsonify({"error": "Email already exists"}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = db.verify_user(data.get('email'), data.get('password'))
    if user:
        return jsonify({
            "message": "Login successful",
            "user": {
                "name": user[0],
                "email": user[1],
                "phone": user[2]
            }
        }), 200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/tasks', methods=['GET', 'POST'])
def tasks():
    user_email = request.args.get('user')
    
    if request.method == 'GET':
        if not user_email:
            return jsonify({"error": "User email required"}), 400
        tasks = db.get_tasks(user_email)
        return jsonify(tasks), 200
    
    if request.method == 'POST':
        data = request.json
        task_id = db.add_task(
            data.get('user'),
            data.get('text'),
            data.get('category'),
            data.get('notes'),
            data.get('due_date')
        )
        return jsonify({"id": task_id, "message": "Task created"}), 201

@app.route('/api/tasks/<int:task_id>', methods=['DELETE', 'PUT'])
def task_operations(task_id):
    if request.method == 'DELETE':
        db.delete_task(task_id)
        return jsonify({"message": "Task deleted"}), 200
    
    if request.method == 'PUT':
        data = request.json
        if 'completed' in data:
            db.update_task_status(task_id, data['completed'])
        return jsonify({"message": "Task updated"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
