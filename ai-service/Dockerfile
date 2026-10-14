FROM python:3.10-slim

# Thiết lập các biến môi trường để tối ưu hóa Python trong container
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HF_HOME=/root/.cache/huggingface

WORKDIR /app

# Cài đặt các thư viện hệ thống cần thiết cho OpenCV, PyTorch & Healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt dependencies trước để tận dụng Docker layer cache
COPY requirements.txt .

# Tối ưu tải PyTorch bản CPU siêu nhẹ (tránh tải bản CUDA GPU nặng ~2.5GB) và cài đặt requirements
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Tải trước trọng số CLIP ViT-B/32 vào cache image để runtime hoàn toàn offline
RUN python -c "from transformers import CLIPModel, CLIPProcessor; CLIPModel.from_pretrained('openai/clip-vit-base-patch32'); CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')"

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Mở cổng dịch vụ AI
EXPOSE 8000

# Kiểm tra tình trạng hoạt động (Healthcheck)
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Khởi chạy Uvicorn Server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
