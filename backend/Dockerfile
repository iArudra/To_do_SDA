FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code
COPY . .

# Expose the API port
EXPOSE 5000

# Start gunicorn server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
