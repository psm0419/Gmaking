import os
import shutil
import random

# 원본 데이터 폴더 (클래스별 폴더만 있는 구조)
ORIGIN_DIR = r"D:\gmaking\aibackend\datasetOriginal"
# 분리된 데이터 저장 폴더
OUTPUT_DIR = r"D:\gmaking\aibackend\dataset"

# 비율 (예: 70% train, 15% val, 15% test)
SPLIT_RATIOS = (0.7, 0.15, 0.15)

# 시드 고정 (재현성)
random.seed(42)

# 분리 실행
for class_name in os.listdir(ORIGIN_DIR):
    class_dir = os.path.join(ORIGIN_DIR, class_name)
    if not os.path.isdir(class_dir):
        continue

    # 이미지 파일 목록 가져오기
    images = [f for f in os.listdir(class_dir) if f.lower().endswith(('.jpg','.jpeg','.png'))]
    random.shuffle(images)

    n_total = len(images)
    n_train = int(n_total * SPLIT_RATIOS[0])
    n_val = int(n_total * SPLIT_RATIOS[1])
    n_test = n_total - n_train - n_val

    split_data = {
        "train": images[:n_train],
        "val": images[n_train:n_train+n_val],
        "test": images[n_train+n_val:]
    }

    for split, split_images in split_data.items():
        out_dir = os.path.join(OUTPUT_DIR, split, class_name)
        os.makedirs(out_dir, exist_ok=True)
        for img in split_images:
            src = os.path.join(class_dir, img)
            dst = os.path.join(out_dir, img)
            shutil.copy2(src, dst)  # 원본 유지, 복사
