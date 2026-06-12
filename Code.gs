/**
 * Invoice Generator — Backend (Google Apps Script Web App)
 * ทำหน้าที่เป็น "ฐานข้อมูล" โดยเก็บไฟล์ PDF + ข้อมูลใบแจ้งหนี้ ลงโฟลเดอร์ Google Drive
 *
 * วิธี Deploy (ดูละเอียดใน README.md):
 *   1. เปิด https://script.google.com → New project → วางโค้ดนี้
 *   2. แก้ FOLDER_ID ด้านล่างให้ตรงกับโฟลเดอร์ของคุณ (ตั้งค่าให้ "ใครมีลิงก์ก็ดูได้")
 *   3. Deploy ▸ New deployment ▸ type: Web app
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   4. คัดลอก Web app URL (.../exec) ไปวางที่ CONFIG.SCRIPT_URL ใน index.html
 */

var FOLDER_ID = "11a2YIzFsXmGqAW5d0Nx8sQR5P_qaU-Xw";   // โฟลเดอร์ Drive ที่ใช้เก็บใบแจ้งหนี้
var INDEX_NAME = "_invoices_index.json";                 // ไฟล์ดัชนี (metadata) ในโฟลเดอร์เดียวกัน

/* ---------- helpers ---------- */
function getFolder_(id){ return DriveApp.getFolderById(id || FOLDER_ID); }

function jsonOut_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function loadIndex_(folder){
  var it = folder.getFilesByName(INDEX_NAME);
  if(it.hasNext()){
    try { return JSON.parse(it.next().getBlob().getDataAsString()); }
    catch(e){ return []; }
  }
  return [];
}

function saveIndex_(folder, arr){
  var it = folder.getFilesByName(INDEX_NAME);
  var blob = Utilities.newBlob(JSON.stringify(arr, null, 2), "application/json", INDEX_NAME);
  if(it.hasNext()){ it.next().setContent(JSON.stringify(arr, null, 2)); }
  else { folder.createFile(blob); }
}

/* ---------- GET: list history ---------- */
function doGet(e){
  try{
    var folderId = (e && e.parameter && e.parameter.folderId) || FOLDER_ID;
    var action = (e && e.parameter && e.parameter.action) || "list";
    var folder = getFolder_(folderId);

    if(action === "list"){
      var idx = loadIndex_(folder);
      // newest first
      idx.sort(function(a,b){ return (b.createdAt||"").localeCompare(a.createdAt||""); });
      return jsonOut_({ ok:true, items: idx });
    }
    return jsonOut_({ ok:false, error:"unknown action" });
  }catch(err){
    return jsonOut_({ ok:false, error: String(err) });
  }
}

/* ---------- POST: save a new invoice PDF ---------- */
function doPost(e){
  try{
    var body = JSON.parse(e.postData.contents);

    // ---- update status of an existing invoice ----
    if(body.action === "updateStatus"){
      var f1 = getFolder_(body.folderId);
      var idx1 = loadIndex_(f1);
      for(var i=0;i<idx1.length;i++){ if(idx1[i].fileId === body.fileId){ idx1[i].status = body.status; } }
      saveIndex_(f1, idx1);
      return jsonOut_({ ok:true });
    }

    if(body.action !== "save") return jsonOut_({ ok:false, error:"unknown action" });

    var folder = getFolder_(body.folderId);
    var meta = body.meta || {};
    var bytes = Utilities.base64Decode(body.pdfBase64);
    var fname = (meta.filename || ("invoice_" + Date.now() + ".pdf"));
    var blob = Utilities.newBlob(bytes, "application/pdf", fname);

    var file = folder.createFile(blob);
    // ให้ใครมีลิงก์เปิดดูได้ (เพื่อให้กดดาวน์โหลดจากหน้าเว็บได้)
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e2){}

    var fileId = file.getId();
    var record = {
      fileId: fileId,
      no: meta.no || "",
      customer: meta.customer || "",
      date: meta.date || "",
      net: meta.net || 0,
      subject: meta.subject || "",
      status: meta.status || "open",
      filename: fname,
      createdAt: meta.createdAt || new Date().toISOString(),
      webViewLink: "https://drive.google.com/file/d/" + fileId + "/view",
      downloadUrl: "https://drive.google.com/uc?export=download&id=" + fileId
    };

    var idx = loadIndex_(folder);
    idx.push(record);
    saveIndex_(folder, idx);

    return jsonOut_({ ok:true, record: record });
  }catch(err){
    return jsonOut_({ ok:false, error: String(err) });
  }
}
