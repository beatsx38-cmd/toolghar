// Helper
const $ = id => document.getElementById(id);
function saveBlob(blob, name){ saveAs(blob, name); }
function kb(n){ return (n/1024).toFixed(2) + ' KB'; }
function mb(n){ return (n/1024/1024).toFixed(2) + ' MB'; }

// ---------- Image conversions ----------
// JPG -> PNG
$('jpgToPngProcess').addEventListener('click', async () => {
  const file = $('jpgToPngFile').files?.[0];
  const status = $('jpgToPngStatus'), preview = $('jpgToPngPreview'), dl = $('jpgToPngDownload');
  status.textContent=''; preview.innerHTML=''; dl.style.display='none';
  if(!file){ status.textContent='कृपया JPG चुनें।'; return; }
  try{
    const img = new Image(); img.src = URL.createObjectURL(file); await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
    canvas.getContext('2d').drawImage(img,0,0);
    canvas.toBlob(blob => {
      preview.innerHTML = `<img src="${URL.createObjectURL(blob)}">`;
      dl.style.display='inline-block'; dl.onclick = ()=> saveBlob(blob, file.name.replace(/\.[^/.]+$/,'') + '.png');
      status.textContent = 'PNG तैयार है।';
    }, 'image/png');
  }catch(e){ status.textContent='Error: '+e.message; console.error(e); }
});

// PNG -> JPG
$('pngToJpgProcess').addEventListener('click', async () => {
  const file = $('pngToJpgFile').files?.[0]; const q = parseFloat($('pngToJpgQuality').value)||0.9;
  const status = $('pngToJpgStatus'), preview = $('pngToJpgPreview'), dl = $('pngToJpgDownload');
  status.textContent=''; preview.innerHTML=''; dl.style.display='none';
  if(!file){ status.textContent='कृपया PNG चुनें।'; return; }
  try{
    const img = new Image(); img.src = URL.createObjectURL(file); await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0);
    canvas.toBlob(blob => {
      preview.innerHTML = `<img src="${URL.createObjectURL(blob)}">`;
      dl.style.display='inline-block'; dl.onclick = ()=> saveBlob(blob, file.name.replace(/\.[^/.]+$/,'') + '.jpg');
      status.textContent = 'JPG तैयार है।';
    }, 'image/jpeg', q);
  }catch(e){ status.textContent='Error: '+e.message; console.error(e); }
});

// JPG -> PDF (multiple)
$('jpgToPdfProcess').addEventListener('click', async () => {
  const files = Array.from($('jpgToPdfFile').files || []);
  const status = $('jpgToPdfStatus'), preview = $('jpgToPdfPreview'), dl = $('jpgToPdfDownload');
  status.textContent=''; preview.innerHTML=''; dl.style.display='none';
  if(!files.length){ status.textContent='कृपया images चुनें।'; return; }
  try{
    status.textContent='Processing...';
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    for(const file of files){
      const arr = await file.arrayBuffer();
      let img;
      try{ img = await pdfDoc.embedJpg(arr); }
      catch{ img = await pdfDoc.embedPng(arr); }
      const page = pdfDoc.addPage([img.width, img.height]);
      page.drawImage(img, { x:0, y:0, width: img.width, height: img.height });
    }
    const bytes = await pdfDoc.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    preview.innerHTML = `<iframe src="${url}" style="width:100%;height:300px;border:0"></iframe>`;
    dl.style.display='inline-block'; dl.onclick = ()=> saveBlob(blob, 'images_converted.pdf');
    status.textContent = 'PDF तैयार है।';
  }catch(e){ status.textContent='Error: '+e.message; console.error(e); }
});

// ---------- PDF -> JPG using pdf.js ----------
$('pdfToJpgProcess').addEventListener('click', async () => {
  const file = $('pdfToJpgFile').files?.[0]; const scale = parseFloat($('pdfToJpgScale').value)||1;
  const status = $('pdfToJpgStatus'), preview = $('pdfToJpgPreview');
  status.textContent=''; preview.innerHTML='';
  if(!file){ status.textContent='कृपया PDF चुनें।'; return; }
  try{
    status.textContent='Rendering pages...';
    const array = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({data: array});
    const pdf = await loadingTask.promise;
    for(let i=1;i<=pdf.numPages;i++){
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({scale});
      const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({canvasContext: ctx, viewport}).promise;
      // convert canvas to blob and show download link
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.95));
      const img = document.createElement('img'); img.src = URL.createObjectURL(blob);
      const btn = document.createElement('button'); btn.textContent = `Download page ${i}.jpg`; btn.onclick = ()=> saveBlob(blob, `page-${i}.jpg`);
      const wrap = document.createElement('div'); wrap.appendChild(img); wrap.appendChild(btn);
      preview.appendChild(wrap);
    }
    status.textContent = 'Pages extracted.';
  }catch(e){ status.textContent='Error: '+e.message; console.error(e); }
});

// ---------- Merge PDF ----------
$('mergePdfProcess').addEventListener('click', async () => {
  const files = Array.from($('mergePdfFiles').files || []);
  const status = $('mergePdfStatus'), dl = $('mergePdfDownload');
  status.textContent=''; dl.style.display='none';
  if(files.length<2){ status.textContent='कम से कम 2 PDF चुनें।'; return; }
  try{
    status.textContent='Merging...';
    const { PDFDocument } = PDFLib;
    const merged = await PDFDocument.create();
    for(const f of files){
      const bytes = await f.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const copied = await merged.copyPages(pdf, pdf.getPageIndices());
      copied.forEach(p => merged.addPage(p));
    }
    const out = await merged.save();
    const blob = new Blob([out], { type: 'application/pdf' });
    dl.style.display='inline-block'; dl.onclick = ()=> saveBlob(blob, 'merged.pdf');
    status.textContent = 'Merged PDF तैयार है।';
  }catch(e){ status.textContent='Error: '+e.message; console.error(e); }
});

// ---------- Split PDF ----------
function parseRanges(str, maxPages){
  const parts = str.split(',').map(s=>s.trim()).filter(Boolean);
  const ranges = [];
  for(const p of parts){
    if(p.includes('-')){
      const [a,b] = p.split('-').map(x=>parseInt(x));
      if(!isNaN(a) && !isNaN(b)) ranges.push({from: a-1, to: b-1});
    } else {
      const n = parseInt(p); if(!isNaN(n)) ranges.push({from: n-1, to: n-1});
    }
  }
  return ranges.filter(r => r.from>=0 && r.to>=r.from && r.from<maxPages);
}
$('splitPdfProcess').addEventListener('click', async () => {
  const file = $('splitPdfFile').files?.[0]; const rangesStr = $('splitRanges').value || '';
  const status = $('splitPdfStatus'), preview = $('splitPdfPreview');
  status.textContent=''; preview.innerHTML='';
  if(!file){ status.textContent='कृपया PDF चुनें।'; return; }
  try{
    const { PDFDocument } = PDFLib;
    const bytes = await file.arrayBuffer();
    const src = await PDFDocument.load(bytes);
    const max = src.getPageCount();
    const ranges = parseRanges(rangesStr, max);
    if(!ranges.length){ status.textContent='कृपया valid ranges डालें।'; return; }
    for(const r of ranges){
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, Array.from({length: r.to - r.from +1}, (_,i)=>i + r.from));
      pages.forEach(p => out.addPage(p));
      const ob = await out.save();
      const blob = new Blob([ob], { type: 'application/pdf' });
      const btn = document.createElement('button'); btn.textContent = `Download ${r.from+1}-${r.to+1}.pdf`; btn.onclick = ()=> saveBlob(blob, `split_${r.from+1}_${r.to+1}.pdf`);
      preview.appendChild(btn);
    }
    status.textContent = 'Split complete.';
  }catch(e){ status.textContent='Error: '+e.message; console.error(e); }
});

// ---------- Compress PDF (basic) ----------
$('compressPdfProcess').addEventListener('click', async () => {
  const file = $('compressPdfFile').files?.[0]; const q = parseFloat($('compressPdfQuality').value)||0.8;
  const status = $('compressPdfStatus'), dl = $('compressPdfDownload');
  status.textContent=''; dl.style.display='none';
  if(!file){ status.textContent='कृपया PDF चुनें।'; return; }
  try{
    status.textContent='Compressing images inside PDF...';
    // Strategy: render each page via pdf.js to canvas at lower scale, then reassemble with pdf-lib
    const array = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({data: array});
    const pdf = await loadingTask.promise;
    const { PDFDocument } = PDFLib;
    const outPdf = await PDFDocument.create();
    for(let i=1;i<=pdf.numPages;i++){
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({scale: 1});
      const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
      // reduce resolution by quality factor
      canvas.width = Math.round(viewport.width * q);
      canvas.height = Math.round(viewport.height * q);
      await page.render({canvasContext: ctx, viewport: page.getViewport({scale: q})}).promise;
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', q));
      const arr = await blob.arrayBuffer();
      const img = await outPdf.embedJpg(arr).catch(()=>outPdf.embedPng(arr));
      const p = outPdf.addPage([img.width, img.height]);
      p.drawImage(img, { x:0, y:0, width: img.width, height: img.height });
    }
    const outBytes = await outPdf.save();
    const blob = new Blob([outBytes], { type: 'application/pdf' });
    dl.style.display='inline-block'; dl.onclick = ()=> saveBlob(blob, 'compressed.pdf');
    status.textContent = 'Compressed PDF ready.';
  }catch(e){ status.textContent='Error: '+e.message; console.error(e); }
});

// ---------- Image compressor using browser-image-compression ----------
$('compressProcess').addEventListener('click', async () => {
  const file = $('compressFile').files?.[0]; const targetMB = parseFloat($('compressTarget').value)||1;
  const status = $('compressStatus'), preview = $('compressPreview'), dl = $('compressDownload');
  status.textContent=''; preview.innerHTML=''; dl.style.display='none';
  if(!file){ status.textContent='कृपया image चुनें।'; return; }
  try{
    status.textContent='Compressing...';
    const options = { maxSizeMB: targetMB, useWebWorker:true };
    const compressed = await imageCompression(file, options);
    status.textContent = `Original ${mb(file.size)} → Compressed ${mb(compressed.size)}`;
    const url = URL.createObjectURL(compressed);
    preview.innerHTML = `<img src="${url}">`;
    dl.style.display='inline-block'; dl.onclick = ()=> saveBlob(compressed, file.name.replace(/\.[^/.]+$/,'') + '_compressed' + file.name.match(/\.[^/.]+$/)[0]);
  }catch(e){ status.textContent='Error: '+e.message; console.error(e); }
});

// ---------- Image Resizer ----------
$('resizeProcess').addEventListener('click', async () => {
  const file = $('resizeFile').files?.[0]; const w = parseInt($('resizeWidth').value)||0; const h = parseInt($('resizeHeight').value)||0; const lock = $('resizeLock').checked;
  const status = $('resizeStatus'), preview = $('resizePreview'), dl = $('resizeDownload');
  status.textContent=''; preview.innerHTML=''; dl.style.display='none';
  if(!file){ status.textContent='कृपया image चुनें।'; return; }
  try{
    const img = new Image(); img.src = URL.createObjectURL(file); await img.decode();
    let nw = w, nh = h;
    if(lock){
      if(w && !h) nh = Math.round(img.height * (w / img.width));
      else if(h && !w) nw = Math.round(img.width * (h / img.height));
      else if(!w && !h){ nw = img.width; nh = img.height; }
    } else {
      if(!nw) nw = img.width; if(!nh) nh = img.height;
    }
    const canvas = document.createElement('canvas'); canvas.width = nw; canvas.height = nh;
    canvas.getContext('2d').drawImage(img,0,0,nw,nh);
    canvas.toBlob(blob => {
      preview.innerHTML = `<img src="${URL.createObjectURL(blob)}">`;
      dl.style.display='inline-block'; dl.onclick = ()=> saveBlob(blob, file.name.replace(/\.[^/.]+$/,'') + `_resized${nw}x${nh}` + file.name.match(/\.[^/.]+$/)[0]);
      status.textContent = `Resized to ${nw} x ${nh}`;
    }, 'image/jpeg', 0.92);
  }catch(e){ status.textContent='Error: '+e.message; console.error(e); }
});

// ---------- Word Counter ----------
$('wordCountBtn').addEventListener('click', () => {
  const txt = $('wordText').value || '';
  const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
  const chars = txt.length;
  const charsNoSpace = txt.replace(/\s/g,'').length;
  const sentences = (txt.match(/[.!?]+/g) || []).length;
  const paragraphs = (txt.trim() ? txt.trim().split(/\n+/).length : 0);
  $('wordStatus').textContent = `Words: ${words} | Characters: ${chars} | Characters (no spaces): ${charsNoSpace} | Sentences: ${sentences} | Paragraphs: ${paragraphs}`;
  const dl = $('wordDownload'); dl.style.display='inline-block'; dl.onclick = ()=> saveBlob(new Blob([txt],{type:'text/plain'}),'text.txt');
});

// ---------- Case Converter ----------
document.querySelectorAll('.caseBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action; let txt = $('caseText').value || '';
    if(action==='upper') txt = txt.toUpperCase();
    else if(action==='lower') txt = txt.toLowerCase();
    else if(action==='title') txt = txt.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
    $('caseText').value = txt; $('caseStatus').textContent = 'Converted.';
    const dl = $('caseDownload'); dl.style.display='inline-block'; dl.onclick = ()=> saveBlob(new Blob([txt],{type:'text/plain'}),'converted.txt');
  });
});

// ---------- Percentage ----------
$('percentCalc').addEventListener('click', () => {
  const p = parseFloat($('percentPart').value); const w = parseFloat($('percentWhole').value);
  if(isNaN(p) || isNaN(w) || w===0){ $('percentStatus').textContent='Invalid input.'; return; }
  const perc = (p / w) * 100;
  $('percentStatus').textContent = `${p} is ${perc.toFixed(2)}% of ${w}`;
});

// ---------- EMI ----------
$('emiCalc').addEventListener('click', () => {
  const P = parseFloat($('emiAmount').value); const annual = parseFloat($('emiRate').value); const n = parseInt($('emiTenure').value);
  if(isNaN(P)||isNaN(annual)||isNaN(n)||n<=0){ $('emiStatus').textContent='Invalid input.'; return; }
  const r = annual/12/100;
  const emi = (P * r * Math.pow(1+r,n)) / (Math.pow(1+r,n)-1);
  const total = emi * n; const interest = total - P;
  $('emiStatus').textContent = `EMI: ₹${emi.toFixed(2)} | Total Interest: ₹${interest.toFixed(2)} | Total Payment: ₹${total.toFixed(2)}`;
});

// ---------- GST ----------
$('gstCalc').addEventListener('click', () => {
  const amt = parseFloat($('gstAmount').value); const rate = parseFloat($('gstRate').value);
  if(isNaN(amt)||isNaN(rate)){ $('gstStatus').textContent='Invalid input.'; return; }
  const gst = amt * rate / 100; const total = amt + gst;
  $('gstStatus').textContent = `GST: ₹${gst.toFixed(2)} | Total: ₹${total.toFixed(2)}`;
});

// ---------- Discount ----------
$('discCalc').addEventListener('click', () => {
  const orig = parseFloat($('origPrice').value); const d = parseFloat($('discRate').value);
  if(isNaN(orig)||isNaN(d)){ $('discStatus').textContent='Invalid input.'; return; }
  const off = orig * d / 100; const finalP = orig - off;
  $('discStatus').textContent = `Discount: ₹${off.toFixed(2)} | Final Price: ₹${finalP.toFixed(2)}`;
});

// ---------- BMI ----------
$('bmiCalc').addEventListener('click', () => {
  const w = parseFloat($('bmiWeight').value); const hcm = parseFloat($('bmiHeight').value);
  if(isNaN(w)||isNaN(hcm)||hcm===0){ $('bmiStatus').textContent='Invalid input.'; return; }
  const h = hcm/100; const bmi = w / (h*h);
  let cat = 'Normal';
  if(bmi<18.5) cat='Underweight'; else if(bmi>=25) cat='Overweight/Obese';
  $('bmiStatus').textContent = `BMI: ${bmi.toFixed(2)} | Category: ${cat}`;
});

// ---------- Password Generator ----------
$('passGen').addEventListener('click', () => {
  const len = parseInt($('passLen').value)||12;
  const useU = $('passUpper').checked; const useL = $('passLower').checked; const useN = $('passNum').checked; const useS = $('passSym').checked;
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower='abcdefghijklmnopqrstuvwxyz', nums='0123456789', syms='!@#$%^&*()-_=+[]{};:,.<>?';
  let pool = ''; if(useU) pool+=upper; if(useL) pool+=lower; if(useN) pool+=nums; if(useS) pool+=syms;
  if(!pool){ $('passStatus').textContent='Select at least one charset.'; return; }
  let pw=''; for(let i=0;i<len;i++) pw += pool[Math.floor(Math.random()*pool.length)];
  $('passStatus').textContent = pw;
  $('passCopy').style.display='inline-block'; $('passDownload').style.display='inline-block';
  $('passCopy').onclick = ()=> { navigator.clipboard?.writeText(pw); alert('Copied to clipboard'); };
  $('passDownload').onclick = ()=> saveBlob(new Blob([pw],{type:'text/plain'}),'password.txt');
});

// ---------- QR Code ----------
$('qrGen').addEventListener('click', () => {
  const text = $('qrText').value || ''; const size = parseInt($('qrSize').value) || 200;
  const status = $('qrStatus'), preview = $('qrPreview'), dl = $('qrDownload');
  status.textContent=''; preview.innerHTML=''; dl.style.display='none';
  if(!text){ status.textContent='Enter text or URL.'; return; }
  const qrDiv = document.createElement('div'); preview.appendChild(qrDiv);
  new QRCode(qrDiv, { text, width: size, height: size, correctLevel: QRCode.CorrectLevel.H });
  setTimeout(()=> {
    const img = qrDiv.querySelector('img') || qrDiv.querySelector('canvas');
    if(!img){ status.textContent='Preview ready.'; return; }
    dl.style.display='inline-block';
    dl.onclick = () => {
      if(img.tagName === 'IMG'){ fetch(img.src).then(r=>r.blob()).then(b=> saveBlob(b, 'qrcode.png')); }
      else { img.toBlob(b => saveBlob(b,'qrcode.png')); }
    };
    status.textContent='QR ready.';
  }, 200);
});

// ---------- Unit Converter (basic) ----------
function convertUnits(category, from, to, value){
  if(category==='length'){
    const map = { m:1, cm:0.01, mm:0.001, km:1000, in:0.0254, ft:0.3048 };
    return value * (map[from] ? map[from] : 1) / (map[to] ? map[to] : 1);
  } else if(category==='weight'){
    const map = { kg:1, g:0.001, mg:0.000001, lb:0.453592, oz:0.0283495 };
    return value * (map[from] ? map[from] : 1) / (map[to] ? map[to] : 1);
  } else if(category==='temperature'){
    if(from==='C' && to==='F') return (value * 9/5) + 32;
    if(from==='F' && to==='C') return (value - 32) * 5/9;
    if(from===to) return value;
    // fallback
    return value;
  }
  return null;
}
$('unitConvert').addEventListener('click', () => {
  const cat = $('unitCategory').value; const from = $('unitFrom').value.trim(); const to = $('unitTo').value.trim(); const val = parseFloat($('unitValue').value);
  if(!from || !to || isNaN(val)){ $('unitStatus').textContent='Invalid input.'; return; }
  const res = convertUnits(cat, from, to, val);
  $('unitStatus').textContent = `Result: ${res}`;
});

// ---------- Number to Words (English and Hindi basic) ----------
function numberToWordsEn(num){
  if(num===0) return 'zero';
  const a = ['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const b = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  function inWords(n){
    if(n<20) return a[n];
    if(n<100) return b[Math.floor(n/10)] + (n%10? ' ' + a[n%10] : '');
    if(n<1000) return a[Math.floor(n/100)] + ' hundred' + (n%100? ' ' + inWords(n%100) : '');
    for(const [val, name] of [[1e9,'billion'],[1e6,'million'],[1e3,'thousand']]){
      if(n>=val) return inWords(Math.floor(n/val)) + ' ' + name + (n%val? ' ' + inWords(n%val) : '');
    }
    return '';
  }
  return inWords(num);
}
function numberToWordsHi(num){
  // Simple Hindi converter for up to crores (limited)
  if(num===0) return 'शून्य';
  const ones = ['','एक','दो','तीन','चार','पाँच','छह','सात','आठ','नौ','दस','ग्यारह','बारह','तेरह','चौदह','पंद्रह','सोलह','सत्रह','अठारह','उन्नीस'];
  const tens = ['','','बीस','तीस','चालीस','पचास','साठ','सत्तर','अस्सी','नब्बे'];
  function inWords(n){
    if(n<20) return ones[n];
    if(n<100) return tens[Math.floor(n/10)] + (n%10? ' ' + ones[n%10] : '');
    if(n<1000) return ones[Math.floor(n/100)] + ' सौ' + (n%100? ' ' + inWords(n%100) : '');
    if(n<100000) return inWords(Math.floor(n/1000)) + ' हजार' + (n%1000? ' ' + inWords(n%1000) : '');
    if(n<10000000) return inWords(Math.floor(n/100000)) + ' लाख' + (n%100000? ' ' + inWords(n%100000) : '');
    return inWords(Math.floor(n/10000000)) + ' करोड़' + (n%10000000? ' ' + inWords(n%10000000) : '');
  }
  return inWords(num);
}
$('numWordsBtn').addEventListener('click', () => {
  const n = parseInt($('numWordsInput').value); const lang = $('numWordsLang').value;
  if(isNaN(n)){ $('numWordsStatus').textContent='Invalid number.'; return; }
  $('numWordsStatus').textContent = lang==='hi' ? numberToWordsHi(n) : numberToWordsEn(n);
});

// ---------- Date Calculator ----------
$('dateCalcBtn').addEventListener('click', () => {
  const f = $('dateFrom').value; const t = $('dateTo').value;
  if(!f || !t){ $('dateCalcStatus').textContent='Select both dates.'; return; }
  const d1 = new Date(f); const d2 = new Date(t);
  const diff = Math.abs(d2 - d1); const days = Math.floor(diff / (1000*60*60*24));
  $('dateCalcStatus').textContent = `Difference: ${days} days`;
});

// ---------- Age Calculator ----------
$('ageCalcBtn').addEventListener('click', () => {
  const b = $('ageBirth').value; if(!b){ $('ageCalcStatus').textContent='Select birthdate.'; return; }
  const bd = new Date(b); const now = new Date();
  let years = now.getFullYear() - bd.getFullYear();
  let months = now.getMonth() - bd.getMonth();
  let days = now.getDate() - bd.getDate();
  if(days<0){ months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if(months<0){ years--; months += 12; }
  $('ageCalcStatus').textContent = `Age: ${years} years, ${months} months, ${days} days`;
});

// ---------- Debug helper ----------
(function debugCheck(){
  window.addEventListener('error', e => console.error('Global error:', e.message, e.filename+':'+e.lineno));
  window.addEventListener('unhandledrejection', e => console.error('Unhandled rejection:', e.reason));
})();
