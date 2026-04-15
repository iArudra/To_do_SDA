from flask import Flask, request, jsonify
from flask_cors import CORS
from db import Database
from google.oauth2 import id_token
from google.auth.transport import requests
import os
import razorpay
import traceback
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

GOOGLE_CLIENT_ID = os.getenv('VITE_GOOGLE_CLIENT_ID')
RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID')
RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET')

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
db = Database()

# Debug: Check if keys are loaded
print(f"--- Razorpay Config ---")
print(f"Key ID: {RAZORPAY_KEY_ID[:8] if RAZORPAY_KEY_ID else 'MISSING'}...")
print(f"Key Secret: {'SET' if RAZORPAY_KEY_SECRET else 'MISSING'}")
print(f"-----------------------")

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

@app.route('/api/google-login', methods=['POST'])
def google_login():
    token = request.json.get('token')
    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        
        # Check if user exists, otherwise create
        user = db.get_user_by_email(email)
        if not user:
            db.create_oauth_user(name, email)
            user = db.get_user_by_email(email)
            
        return jsonify({
            "message": "Login successful",
            "user": {
                "name": user[0],
                "email": user[1],
                "phone": user[2]
            }
        }), 200
    except ValueError:
        # Invalid token
        return jsonify({"error": "Invalid Google token"}), 400

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

@app.route('/api/create-order', methods=['POST'])
def create_order():
    data = request.json
    user_email = data.get('email')
    item_id = data.get('itemId')
    amount = data.get('amount') # In paise, e.g. 5000 for ₹50
    
    if not all([user_email, item_id, amount]):
        return jsonify({"error": "Missing parameters"}), 400

    order_data = {
        "amount": amount,
        "currency": "INR",
        "receipt": f"r_{item_id[:10]}_{os.urandom(4).hex()}", # Limit 40 chars
        "payment_capture": 1
    }
    
    try:
        razorpay_order = client.order.create(data=order_data)
        db.add_purchase(user_email, item_id, amount, razorpay_order['id'])
        return jsonify(razorpay_order), 200
    except Exception as e:
        print(f"ERROR creating order: {str(e)}")
        traceback.print_exc() # This will print the full error to your terminal!
        return jsonify({"error": f"Razorpay error: {str(e)}"}), 500

@app.route('/api/verify-payment', methods=['POST'])
def verify_payment():
    data = request.json
    try:
        # Verify the signature
        client.utility.verify_payment_signature({
            'razorpay_order_id': data.get('razorpay_order_id'),
            'razorpay_payment_id': data.get('razorpay_payment_id'),
            'razorpay_signature': data.get('razorpay_signature')
        })
        
        # If verification is successful, update DB
        db.update_purchase_success(data.get('razorpay_order_id'), data.get('razorpay_payment_id'))
        return jsonify({"status": "Payment verified and theme unlocked"}), 200
    except Exception as e:
        return jsonify({"error": "Payment verification failed"}), 400

@app.route('/api/user-purchases', methods=['GET'])
def user_purchases():
    user_email = request.args.get('user')
    if not user_email:
        return jsonify({"error": "User required"}), 400
    themes = db.get_purchased_themes(user_email)
    return jsonify({"themes": themes}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
