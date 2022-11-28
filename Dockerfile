FROM python:3.8.15-slim-buster
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app
CMD ["uvicorn", "main:app",  "--host", "0.0.0.0", "--port", "8000"]

