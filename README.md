# ระบบสร้างใบแจ้งหนี้ / Invoice Generator

เว็บแอปสร้างใบแจ้งหนี้ (ภาษาไทย) แบบ **กรอกฟอร์ม → Preview → Generate PDF** พร้อมแท็บ **ประวัติ (History)** ที่เก็บไฟล์ไว้บน **Google Drive** ใช้งานได้ฟรี ไม่ต้องมีเซิร์ฟเวอร์

- หน้าเว็บ (frontend) = ไฟล์ HTML ไฟล์เดียว โฮสต์ฟรีบน **GitHub Pages**
- ฐานข้อมูล (backend) = **Google Apps Script Web App** ที่เซฟ PDF ลงโฟลเดอร์ Drive ของคุณ
- เปิดเป็น Public ได้ — ใครมีลิงก์ก็เข้าใช้ได้

---

## โครงสร้างไฟล์

| ไฟล์ | หน้าที่ |
|------|--------|
| `index.html` | หน้าเว็บทั้งหมด (ฟอร์ม + Preview + Generate PDF + History) |
| `Code.gs` | โค้ด Google Apps Script (backend เก็บไฟล์ลง Drive) |
| `README.md` | คู่มือนี้ |

---

## คุณสมบัติ

- กรอกข้อมูล: ผู้ขาย (เติมข้อมูล Transformational ไว้ให้, แก้ได้), ลูกค้า, เลขที่/วันที่, รายการหลายบรรทัด
- **VAT 7% อัตโนมัติ** + ยอดเงินสุทธิ = รวมเงิน + VAT
- **ตัวอักษร (Thai Baht text) อัตโนมัติ** เช่น "สองแสนหกหมื่น...บาทถ้วน"
- ปุ่ม **Preview** ดูตัวอย่างก่อน ถ้าไม่ผ่านกลับไปแก้ได้, ถ้าผ่านกด **Generate PDF** เพื่อดาวน์โหลด
- รองรับ **ต้นฉบับ / สำเนา (Original/Copy)**
- **อัปโหลดโลโก้บริษัท** เองได้ (ฝังลงใน PDF, จำค่าไว้ในเบราว์เซอร์)
- หน้าซ้ายกรอก → **Render ตัวอย่างด้านขวาแบบทันที (live)**
- แท็บ **History** สไตล์ตารางรายการ: ตัวกรองสถานะ (ทั้งหมด/ร่าง/ค้างชำระ/เกินกำหนด/ชำระแล้ว), ค้นหา, avatar ลูกค้า, กดที่ป้ายสถานะเพื่อเปลี่ยนได้ + ปุ่มดาวน์โหลด

> ก่อนตั้งค่า Drive ระบบจะเก็บประวัติไว้ในเบราว์เซอร์ (localStorage) ให้ทดลองได้ทันที

---

## วิธีติดตั้ง

### ขั้นที่ 1 — Deploy Backend (Google Apps Script)

1. เปิด <https://script.google.com> → **New project**
2. ลบโค้ดเดิม แล้ววางเนื้อหาจาก `Code.gs` ทั้งหมด
3. ตรวจ `FOLDER_ID` ให้ตรงกับโฟลเดอร์ Drive ของคุณ (ค่าเริ่มต้นตั้งไว้แล้ว: `11a2YIzFsXmGqAW5d0Nx8sQR5P_qaU-Xw`)
4. กด **Deploy ▸ New deployment ▸** เลือกชนิด **Web app**
   - **Execute as:** Me
   - **Who has access:** Anyone
5. กด **Deploy**, อนุญาตสิทธิ์ (Authorize) แล้ว **คัดลอก Web app URL** (ลงท้าย `/exec`)

> โฟลเดอร์ Drive ควรตั้งแชร์เป็น **"ใครมีลิงก์ก็ดูได้ (Anyone with the link – Viewer)"** เพื่อให้กดดาวน์โหลดไฟล์จากหน้าเว็บได้

### ขั้นที่ 2 — ใส่ URL ลงในหน้าเว็บ

เปิด `index.html` หาบรรทัด:

```js
const CONFIG = {
  SCRIPT_URL: "",   // <-- วาง Web app URL ที่นี่
  DRIVE_FOLDER_ID: "11a2YIzFsXmGqAW5d0Nx8sQR5P_qaU-Xw"
};
```

วาง URL จากขั้นที่ 1 ลงใน `SCRIPT_URL` เช่น
`"https://script.google.com/macros/s/AKfy....../exec"`

### ขั้นที่ 3 — โฮสต์หน้าเว็บฟรีด้วย GitHub Pages

```bash
git clone https://github.com/surasitk/tf_invoice_generater.git
cd tf_invoice_generater
cp /path/to/index.html .
cp /path/to/Code.gs .
cp /path/to/README.md .
git add .
git commit -m "Add invoice generator app"
git push
```

จากนั้นใน GitHub: **Settings ▸ Pages ▸ Source: Deploy from a branch ▸ main / root ▸ Save**
รอสักครู่จะได้ลิงก์สาธารณะ เช่น
`https://surasitk.github.io/tf_invoice_generater/`

แชร์ลิงก์นี้ให้ใครก็ได้ใช้งาน 🎉

---

## การใช้งาน

1. แท็บ **สร้างใบแจ้งหนี้** → กรอกข้อมูลลูกค้า เลขที่ วันที่ และรายการ
2. กด **Preview** เพื่อตรวจสอบ
3. กด **Generate PDF** → ไฟล์จะถูกดาวน์โหลด และบันทึกขึ้น Drive อัตโนมัติ
4. แท็บ **ประวัติ (History)** → ดูรายการเดิม และกดดาวน์โหลดซ้ำได้

---

## หมายเหตุทางเทคนิค

- PDF สร้างฝั่งเบราว์เซอร์ด้วย `html2canvas` + `jsPDF` (ฟอนต์ไทย Sarabun เรนเดอร์ถูกต้อง)
- ไม่มีการเก็บข้อมูลที่เซิร์ฟเวอร์อื่นนอกจาก Google Drive ของคุณเอง
- ดัชนีรายการเก็บเป็นไฟล์ `_invoices_index.json` ในโฟลเดอร์เดียวกัน
