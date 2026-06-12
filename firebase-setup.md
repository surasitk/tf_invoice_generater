# ตั้งค่า Firebase เป็นฐานข้อมูล (Firestore + Storage)

แอปนี้รองรับการเก็บข้อมูลบน **Firebase** — `Firestore` เก็บ metadata ใบแจ้งหนี้ และ `Storage` (ซึ่งใช้ Google Cloud Storage ภายใต้ project เดียวกัน) เก็บไฟล์ PDF. ความปลอดภัยคุมด้วย **Security Rules** จึงไม่ต้องฝัง service-account key ในเว็บ

## ขั้นตอน

### 1. สร้าง/เลือก Firebase project
- เข้า <https://console.firebase.google.com> → **Add project** แล้วเลือก GCP project เดิมของคุณ (project เดียวกับ GCS ได้เลย)

### 2. เปิด Firestore + Storage
- เมนู **Build ▸ Firestore Database ▸ Create database** (เลือก region เช่น `asia-southeast1`) → Start in **production mode**
- เมนู **Build ▸ Storage ▸ Get started** → ทำตามขั้นตอน (จด **bucket name** ไว้ เช่น `your-project.appspot.com`)

### 3. ลงทะเบียน Web app เพื่อเอา config
- **Project settings (⚙️) ▸ General ▸ Your apps ▸ </> (Web)** → ตั้งชื่อ → Register
- คัดลอกค่า `firebaseConfig` ที่ได้ มาวางใน `index.html` ตรงบล็อก:

```js
const firebaseConfig = {
  apiKey: "....",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "....",
  appId: "...."
};
```

> `apiKey` ของ Firebase **ไม่ใช่ความลับ** — เป็นตัวระบุ project เท่านั้น ความปลอดภัยจริงอยู่ที่ Security Rules ด้านล่าง

### 4. ตั้ง Security Rules

**Firestore** (Firestore ▸ Rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /invoices/{id} {
      allow read: if true;
      allow create, update: if true;
      allow delete: if false;
    }
  }
}
```

**Storage** (Storage ▸ Rules):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /invoices/{file} {
      allow read: if true;
      allow write: if request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('application/pdf');
    }
  }
}
```

> Rules นี้เปิดให้ใครก็ได้สร้าง/อ่าน/อัปเดตสถานะ (เหมาะกับเว็บ public) แต่ห้ามลบ ถ้าต้องการจำกัดเฉพาะคนล็อกอิน ค่อยเพิ่ม Firebase Auth ภายหลัง

### 5. ตั้ง CORS ให้ Storage bucket (จำเป็นสำหรับอัปโหลดจากเว็บ)
สร้างไฟล์ `cors.json`:
```json
[
  {
    "origin": ["https://surasitk.github.io"],
    "method": ["GET", "PUT", "POST", "HEAD"],
    "responseHeader": ["Content-Type", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
```
แล้วรันใน Cloud Shell (หรือเครื่องที่มี gcloud):
```bash
gcloud storage buckets update gs://YOUR-BUCKET --cors-file=cors.json
# หรือ:  gsutil cors set cors.json gs://YOUR-BUCKET
```

### 6. เสร็จ
เปิดเว็บอีกครั้ง — มุมขวาบนของแท็บ History/Dashboard จะขึ้น **"☁️ ข้อมูลจาก Firebase (Cloud)"** ใบแจ้งหนี้ที่สร้างจะถูกเก็บบน Firebase และเห็นได้ทุกเครื่องที่เปิดลิงก์

---

## โครงสร้างข้อมูล
- คอลเลกชัน `invoices` แต่ละ document = ใบแจ้งหนี้ 1 ใบ
  - ฟิลด์: `no, customer, date, net, subject, status, createdAt, filename, downloadUrl, storagePath`
- ไฟล์ PDF เก็บใน Storage path `invoices/<id>.pdf`
