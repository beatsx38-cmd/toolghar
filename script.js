// Basic helpers
const $ = id => document.getElementById(id);
function kb(n){ return (n/1024).toFixed(2) + ' KB'; }
function mb(n){ return (n/1024/1024).toFixed(2) + ' MB'; }
function saveBlob(blob, name){ saveAs(blob, name); }

// ---------- JPG -> PNG ----------
$('jpgToPngProcess').addEventListener('click', async () => {
  const file = $('jpgToPngFile').files[0];
  const status = $('jpgToPngStatus'); const preview = $('jpgToPngPreview'); const dl = $('jpgToPngDownload');
  status.textContent=''; preview.innerHTML=''; dl.style.display='none';
  if(!file){ status.textContent='कृपया JPG फ़ाइल चुनें।'; return; }
  try{
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0);
    canvas.toBlob(blob => {
      const name = file.name.replace(/\.[^/.]+$/,'') + '.png';
      preview.innerHTML = `<img src="${URL.createObjectURL(blob)}">`;
      dl.style.display='inline-block'; dl.onclick = ()=> saveBlob(blob, name);
      status.textContent = 'Conversion complete — PNG ready.';
    }, 'image/png');
  }catch(e){ status.textContent = 'Error: '+e.message; console.error(e); }
});

// ---------- PNG -> JPG ----------
$('pngToJpgProcess').addEventListener('click', async () => {
  const file = $('pngToJpgFile').files[0]; const q = parseFloat($('pngToJpgQuality').value)||0.9;
  const status = $('pngToJpgStatus'); const preview = $('pngToJpgPreview'); const dl = $('pngToJpgDownload');
  status.textContent=''; preview.innerHTML=''; dl.style.display='none';
  if(!file){ status.textContent='कृपया PNG फ़ाइल चुनें।'; return; }
  try{
    const img = new Image(); img.src = URL.createObjectURL(file); await img.decode();
    const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0);
    canvas.toBlob(blob => {
      const name = file.name.replace(/\.[^/.]+$/,'') + '.jpg';
      preview.innerHTML = `<img src="${URL.createObjectURL(blob)}">`;
      dl.style.display='inline-block'; dl.onclick = ()=> saveBlob(blob, name);
      status.textContent = 'Conversion complete — JPG ready.';
    }, 'image/jpeg', q);
  }catch(e){ status.textContent='Error: '+e.message; console.error(e); }
});

// ---------- Image Compressor (browser-image-compression) ----------
$('compressProcess').addEventListener('click', async () => {
  const file = $('compressFile').files[0]; const targetMB = parseFloat($('compressTarget').value)||1;
  const status = $('compressStatus'); const preview = $('compressPreview'); const dl = $('compressDownload');
  status.textContent=''; preview.innerHTML=''; dl.style.display='none';
  if(!file){ status.textContent='कृपया image चुनें।'; return; }
  try{
    status.textContent='Compressing...';
    const options = { maxSizeMB: targetMB, useWebWorker:true };
    const compressed = await imageCompression(file, options);
    status.textContent = `Original: ${mb(file.size)}, Compressed: ${mb(compressed.size)}`;
    const url = URL.createObjectURL(compressed);
    preview.innerHTML = `<img src="${url}">`;
    dl.style.display='inline-block'; dl.onclick = ()=> saveBlob(compressed, file.name.replace(/\.[^/.]+$/,'') + '_compressed' + file.name.match(/\.[^/.]+$/)[0]);
  }catch(e){ status.textContent='Error: '+e.message; console.error(e); }
});

// ---------- Image Resizer ----------
$('resizeProcess').addEventListener('click', async () => {
  const file = $('resizeFile').files[0]; const w = parseInt($('resizeWidth').value)||0; const h = parseInt($('resizeHeight').value)||0; const lock = $('resizeLock').checked;
  const status = $('resizeStatus'); const preview = $('resizePreview'); const dl = $('resizeDownload');
  status.textContent=''; preview.innerHTML=''; dl.style.display='none';
  if(!file){ status.textContent='कृपया image चुनें।'; return; }
  try{
    const img = new Image(); img.src = URL.createObjectURL(file); await img.decode();
    let nw = w, nh = h;
    if(lock){
      if(w && !h){ nh = Math.round(img.height * (w / img.width)); }
      else if(h && !w){ nw = Math.round(img.width * (h / img.height)); }
      else if(!w && !h){ nw = img.width; nh = img.height; }
    } else {
      if(!nw) nw = img.width; if(!nh) nh = img.height;
    }
    const canvas = document.createElement('canvas'); canvas.width = nw; canvas.height = nh;
    const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0,nw,nh);
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
  const dl = $('wordDownload'); dl.style.display='inline-block'; dl.onclick = ()=> {
    const blob = new Blob([txt], {type:'text/plain;charset=utf-8'}); saveBlob(blob, 'text.txt');
  };
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

// ---------- Percentage Calculator ----------
$('percentCalc').addEventListener('click', () => {
  const p = parseFloat($('percentPart').value); const w = parseFloat($('percentWhole').value);
  if(isNaN(p) || isNaN(w) || w===0){ $('percentStatus').textContent='Invalid input.'; return; }
  const perc = (p / w) * 100;
  $('percentStatus').textContent = `${p} is ${perc.toFixed(2)}% of ${w}`;
});

// ---------- EMI Calculator ----------
$('emiCalc').addEventListener('click', () => {
  const P = parseFloat($('emiAmount').value); const annual = parseFloat($('emiRate').value); const n = parseInt($('emiTenure').value);
  if(isNaN(P)||isNaN(annual)||isNaN(n)||n<=0){ $('emiStatus').textContent='Invalid input.'; return; }
  const r = annual/12/100;
  const emi = (P * r * Math.pow(1+r,n)) / (Math.pow(1+r,n)-1);
  const total = emi * n; const interest = total - P;
  $('emiStatus').textContent = `EMI: ₹${emi.toFixed(2)} | Total Interest: ₹${interest.toFixed(2)} | Total Payment: ₹${total.toFixed(2)}`;
});

// ---------- GST Calculator ----------
$('gstCalc').addEventListener('click', () => {
  const amt = parseFloat($('gstAmount').value); const rate = parseFloat($('gstRate').value);
  if(isNaN(amt)||isNaN(rate)){ $('gstStatus').textContent='Invalid input.'; return; }
  const gst = amt * rate / 100; const total = amt + gst;
  $('gstStatus').textContent = `GST: ₹${gst.toFixed(2)} | Total: ₹${total.toFixed(2)}`;
});

// ---------- Discount Calculator ----------
$('discCalc').addEventListener('click', () => {
  const orig = parseFloat($('origPrice').value); const d = parseFloat($('discRate').value);
  if(isNaN(orig)||isNaN(d)){ $('discStatus').textContent='Invalid input.'; return; }
  const off = orig * d / 100; const finalP = orig - off;
  $('discStatus').textContent = `Discount: ₹${off.toFixed(2)} | Final Price: ₹${finalP.toFixed(2)}`;
});

// ---------- BMI Calculator ----------
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

// ---------- QR Code Generator ----------
$('qrGen').addEventListener('click', () => {
  const text = $('qrText').value || ''; const size = parseInt($('qrSize').value) || 200;
  const status = $('qrStatus'); const preview = $('qrPreview'); const dl = $('qrDownload');
  status.textContent=''; preview.innerHTML=''; dl.style.display='none';
  if(!text){ status.textContent='Enter text or URL.'; return; }
  preview.innerHTML = '';
  const qrDiv = document.createElement('div'); preview.appendChild(qrDiv);
  new QRCode(qrDiv, { text, width: size, height: size, correctLevel: QRCode.CorrectLevel.H });
  // create download
  setTimeout(()=> {
    const img = qrDiv.querySelector('img') || qrDiv.querySelector('canvas');
    if(!img){ status.textContent='Preview ready.'; return; }
    dl.style.display='inline-block';
    dl.onclick = () => {
      if(img.tagName === 'IMG'){
        fetch(img.src).then(r=>r.blob()).then(b=> saveBlob(b, 'qrcode.png'));
      } else {
        img.toBlob(b => saveBlob(b,'qrcode.png'));
      }
    };
    status.textContent='QR ready.';
  }, 200);
});

// ---------- Small debug helper to spot missing elements ----------
(function debugCheck(){
  const ids = [
    'jpgToPngFile','jpgToPngProcess','jpgToPngStatus','jpgToPngPreview','jpgToPngDownload',
    'pngToJpgFile','pngToJpgProcess','pngToJpgStatus','pngToJpgPreview','pngToJpgDownload',
    'compressFile','compressProcess','compressStatus','compressPreview','compressDownload'
  ];
  ids.forEach(id => { if(!$(id)) console.warn('Missing element id:', id); });
  window.addEventListener('error', e => console.error('Global error:', e.message, e.filename+':'+e.lineno));
  window.addEventListener('unhandledrejection', e => console.error('Unhandled rejection:', e.reason));
})();
