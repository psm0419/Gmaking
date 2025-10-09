import os
import hashlib
from PIL import Image
import imagehash
import shutil

# ===== 설정 =====
INPUT_DIR = r"d:\Gmaking\aibackend\datasetOriginal\turtle"       # 원본 이미지 폴더
OUTPUT_DIR = r"d:\Gmaking\aibackend\datasetOriginal\turtle2"      # 중복 제거 후 저장할 폴더
CATEGORY_NAME = "turtle"     # 파일명 앞에 붙일 카테고리 이름
HASH_DIFF_THRESHOLD = 1    # pHash 유사도 기준 (0=완전 동일, 5 이하는 거의 같은 이미지)

# ===== 함수 =====
def file_hash(path):
    """파일 바이트 단위 MD5 해시"""
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()

# ===== 메인 로직 =====
def remove_duplicates():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    seen_file_hashes = {}   # 파일 해시 저장
    seen_image_hashes = []  # (pHash, 파일 경로) 저장
    unique_files = []

    for file in os.listdir(INPUT_DIR):
        path = os.path.join(INPUT_DIR, file)
        if not os.path.isfile(path):
            continue

        # 1️⃣ 파일 해시로 완전 동일 여부 확인
        f_hash = file_hash(path)
        def safe_print(text: str) -> str:
            return text.encode("cp949", "replace").decode("cp949")
        if f_hash in seen_file_hashes:
            print(f"file_duplicated: {safe_print(file)} -> {safe_print(os.path.basename(seen_file_hashes[f_hash]))}")
            continue
        seen_file_hashes[f_hash] = path

        # 2️⃣ Perceptual Hash (리사이즈/압축 차이 잡아냄)
        try:
            img = Image.open(path)
            h = imagehash.phash(img)
        except Exception as e:
            print(f"[error] {file}: {e}")
            continue

        is_duplicate = False
        for uh, uh_path in seen_image_hashes:
            if abs(h - uh) <= HASH_DIFF_THRESHOLD:
                print(f"[file_resize] : {file.encode('cp949', 'replace').decode('cp949')} == {os.path.basename(uh_path).encode('cp949', 'replace').decode('cp949')} (pHash diff={abs(h-uh)})")
                is_duplicate = True
                break

        if not is_duplicate:
            seen_image_hashes.append((h, path))   # 기존: seen_image_hashes.append(h)
            unique_files.append(path)

    # 3️⃣ 결과물 저장 (리네이밍 포함)
    for idx, file in enumerate(unique_files, start=1):
        ext = os.path.splitext(file)[1].lower()
        new_name = f"{CATEGORY_NAME}_{idx:03d}{ext}"
        new_path = os.path.join(OUTPUT_DIR, new_name)
        shutil.copy2(file, new_path)

    print(f"\n success! {len(unique_files)} images {OUTPUT_DIR}/ saved.")


# 실행
if __name__ == "__main__":
    remove_duplicates()
