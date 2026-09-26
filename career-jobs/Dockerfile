FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY jobs.py server.py ./
RUN useradd --uid 10001 --create-home appuser && mkdir /data && chown appuser:appuser /data
USER appuser
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 JOBS_DB=/data/jobs.sqlite3 JOBS_SOURCES=/app/sources.json
CMD ["python", "server.py"]
