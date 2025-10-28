from fastapi import FastAPI, UploadFile, File, HTTPException
from ultralytics import YOLO
from ultralytics.data.augment import classify_transforms
from PIL import Image
from io import BytesIO
import torch
import os
from pathlib import Path

app = FastAPI()

# 4가지 동물 클래스 정보
CLASS_NAMES = {
    0: 'bear',
    1: 'eagle',
    2: 'penguin',
    3: 'turtle'
}

IMG_SIZE = 224

# 모델 파일 경로 설정
MODEL_PATH = Path(__file__).resolve().parent / ".." / "ai" / "runs" / "animal_cls_stage1" / "weights" / "best.pt"

model = None
IS_MODEL_LOADED = False

# 모델 로드
print(f"모델 로딩 시도 중... 경로: {MODEL_PATH}")
try:
    if not MODEL_PATH.exists():
        # 파일이 존재하지 않으면 예외 발생
        raise FileNotFoundError(f"모델 파일이 지정된 경로에 존재하지 않습니다: {MODEL_PATH}")
        
    # Path 객체를 str()로 변환하여 YOLO에 전달
    model = YOLO(str(MODEL_PATH))
    IS_MODEL_LOADED = True
    print("모델 로드 성공.")
    
except Exception as e:
    # 모델 로드 실패 시 서버는 실행되지만, 서비스 불가능 상태로 둡니다.
    print("==============================================")
    print(f"치명적인 오류: YOLOv8 모델 로드에 실패했습니다. (경로 확인 필요)")
    print(f"오류 메시지: {e}")
    print("==============================================")


# 이미지 전처리 함수 정의
def preprocess_image(image: Image.Image) -> torch.Tensor:
    """
    YOLOv8 분류 모델 추론을 위한 이미지 전처리 파이프라인 적용
    """
    # YOLOv8의 표준 추론 전처리 파이프라인 (이미지 크기 조정 및 정규화)
    transform = classify_transforms(
        IMG_SIZE,
    )
    
    # 이미지 전처리 및 텐서 변환
    tensor = transform(image)
    
    # 모델이 배치(batch) 차원 (B, C, H, W)을 기대하므로 배치 차원(B) 추가
    return tensor.unsqueeze(0)


# API 엔드포인트 정의
@app.post("/classify/image")
async def classify_image(file: UploadFile = File(...)):
    if not IS_MODEL_LOADED or model is None:
        # 모델 로드 실패 시 503 Service Unavailable 반환
        raise HTTPException(status_code=503, detail="모델 서버가 준비되지 않았습니다. 모델 로드 오류를 확인하세요.")
        
    print(f"🔍 [INFO] 이미지 분류 요청 수신: 파일명='{file.filename}', 크기={file.size}bytes")

    # 1. 이미지 파일 읽기
    content = await file.read()
    
    try:
        # BytesIO를 사용하여 메모리에서 PIL Image로 로드
        image = Image.open(BytesIO(content)).convert("RGB")
    except Exception as e:
        # 이미지 파일 형식이 잘못되었을 때 처리
        raise HTTPException(status_code=400, detail=f"잘못된 이미지 파일 형식입니다: {e}")
    
    # 2. 전처리
    input_tensor = preprocess_image(image)
    
    # 3. 추론 
    # torch.no_grad()를 사용하여 메모리 사용량 절약 및 속도 향상
    with torch.no_grad():
        results = model(input_tensor, imgsz=IMG_SIZE, verbose=False, device='cpu') 
        
    # 4. 결과 해석(결과: Ultralytics Results 객체)
    # results[0]은 배치 결과 중 첫 번째 이미지의 결과
    probs = results[0].probs      # Probabilities 객체 (클래스별 확률)
    top_index = probs.top1        # 가장 높은 확률의 클래스 인덱스 (int)
    confidence = probs.top1conf.item() # 해당 인덱스의 확률 (float)
    
    # 5. 결과 반환
    predicted_class_name = CLASS_NAMES.get(top_index, "Unknown")
    
    response_data = {
        "status": "success",
        "predicted_animal": predicted_class_name, 
        "confidence": round(confidence, 4)       # 소수점 4자리로 반올림
    }
    
    print(f"[RESULT] 예측: {predicted_class_name}, 확신도: {response_data['confidence']}")

    return response_data


# 서버 실행 안내 (터미널)
# uvicorn model_server:app --reload --port 8000
# uvicorn model_server:app --host 0.0.0.0 --port 8000 --reload

# 가상화 실행
# .\venv\Scripts\activate
# uvicorn controller.main:app --reload --host 0.0.0.0 --port 8000