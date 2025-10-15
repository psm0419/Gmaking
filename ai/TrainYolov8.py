from ultralytics import YOLO
import json
import os

# -----------------------------
# 1. 모델 불러오기
# -----------------------------
model = YOLO("yolov8n-cls.pt")  # 가볍고 빠른 nano 모델

# -----------------------------
# 2. 경로 설정
# -----------------------------
DATA_PATH = r"D:\Gmaking\aibackend\dataset"
PROJECT_PATH = r"D:\Gmaking\aibackend\runs"  # runs 폴더 위치 지정

os.makedirs(PROJECT_PATH, exist_ok=True)

# -----------------------------
# 3. 1단계 학습 (CPU 최적화)
# -----------------------------
model.train(
    data=DATA_PATH,
    epochs=20,           # CPU 환경에 맞춰 epoch 줄임
    imgsz=224,
    batch=16,            # CPU라면 배치를 조금 줄이는 게 안전
    name="animal_cls_stage1",
    project=PROJECT_PATH,
    patience=5,          # Early stopping
    lr0=1e-3,
    lrf=0.3,             # cosine 최종 LR
    optimizer="Adam",
    
    # 데이터 증강 최소화 (CPU 병목 줄임)
    fliplr=0.5,          # 좌우 반전만 사용
    degrees=10,
    translate=0.1,
    shear=0.0,
    scale=1.0,
    hsv_v=0.0,
    freeze=0             # head만 학습 (feature extractor 고정)
)

# -----------------------------
# 4. 테스트셋 평가
# -----------------------------
metrics = model.val(split="test", save_json=True)
print("Validation Metrics:")
print(metrics)

# 로그 저장
log_dir = os.path.join(PROJECT_PATH, "animal_cls_stage1", "logs")
os.makedirs(log_dir, exist_ok=True)
with open(os.path.join(log_dir, "metrics.json"), "w", encoding="utf-8") as f:
    json.dump(metrics.results_dict, f, indent=4, ensure_ascii=False)

# -----------------------------
# 5. 라벨맵 자동 생성
# -----------------------------
label_dirs = sorted(os.listdir(os.path.join(DATA_PATH, "train")))
label_map = {i: name for i, name in enumerate(label_dirs)}

with open(os.path.join(PROJECT_PATH, "animal_cls_stage1", "label_map.json"), "w", encoding="utf-8") as f:
    json.dump(label_map, f, indent=4, ensure_ascii=False)

print("라벨맵 저장 완료:", label_map)

# -----------------------------
# 6. TEST 폴더 전체 이미지 예측 + 저장
# -----------------------------
results = model.predict(
    source=os.path.join(DATA_PATH, "test"),
    save=True,
    imgsz=224,
    conf=0.5,
    show=False,
    project=PROJECT_PATH,
    name="animal_cls_pred"
)

print("테스트셋 예측 완료. 결과는 '{}' 폴더에 저장됨.".format(
    os.path.join(PROJECT_PATH, "classify", "animal_cls_pred", "predict")
))

# 17 epochs completed in 0.818 hours. -> 49분
# test: D:\Gmaking\aibackend\dataset\test... found 300 images in 4 classes
#                classes   top1_acc   top5_acc: 100% ━━━━━━━━━━━━ 10/10 0.3it/s 30.6s
#                    all      0.983          1
# Speed: 0.0ms preprocess, 4.9ms inference, 0.0ms loss, 0.0ms postprocess per image
# Ultralytics 8.3.205  Python-3.10.11 torch-2.8.0+cpu CPU (Intel Core i7-4770 3.40GHz)
# YOLOv8n-cls summary (fused): 30 layers, 1,440,004 parameters, 0 gradients, 3.3 GFLOPs

# 데이터/테스트 정보
# 테스트 데이터 경로: D:\Gmaking\aibackend\dataset\test.cache
# 테스트 진행: 19장(batch?)
# 진행 속도: 약 0.6 images/sec, 총 소요 30.3초

# 성능 지표
# Top-1 Accuracy: 0.98 → 98%
# Top-5 Accuracy: 1.0 → 100%
# Fitness: 0.99 (학습 모델 평가 지표, 높을수록 좋음)
# 속도 per image:
# Preprocess: 0.0026 ms
# Inference: 5.24 ms
# Loss 계산: 0.00013 ms
# Postprocess: 0.00032 ms