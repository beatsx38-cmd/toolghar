const tools=[
["📄","JPG → PDF","PDF Tools","Images को एक PDF में बदलें","jpgpdf"],
["🖼️","PDF → JPG","PDF Tools","PDF pages को JPG images में बदलें","pdfjpg"],
["🖼️","JPG → PNG","Image Tools","JPG image को PNG में बदलें","jpgpng"],
["🌐","PNG → JPG","Image Tools","PNG image को JPG में बदलें","pngjpg"],
["📦","Image Compressor","Image Tools","Image size कम करें","compress"],
["📐","Image Resizer","Image Tools","Image की width और height बदलें","resize"],
["🔗","Merge PDF","PDF Tools","कई PDF files को जोड़ें","merge"],
["✂️","Split PDF","PDF Tools","PDF pages को अलग करें","split"],
["🗜️","Compress PDF","PDF Tools","PDF file का size कम करें","pdfcompress"],
["📝","Word Counter","Text Tools","Words और characters गिनें","words"],
["🔠","Case Converter","Text Tools","UPPERCASE / lowercase बदलें","case"],
["🔢","Percentage Calculator","Calculators","Percentage calculate करें","percent"],
["🎂","Age Calculator","Calculators","उम्र calculate करें","age"],
["💳","EMI Calculator","Calculators","Loan EMI calculate करें","emi"],
["🧾","GST Calculator","Calculators","GST amount calculate करें","gst"],
["💰","Discount Calculator","Calculators","Discount के बाद price निकालें","discount"],
["⚖️","BMI Calculator","Calculators","BMI calculate करें","bmi"],
["📅","Date Calculator","Calculators","दो dates के बीच days निकालें","date"],
["🔐","Password Generator","Security","Strong random password बनाएं","password"],
["📱","QR Code Generator","Other Tools","Text/URL से QR code बनाएं","qr"],
["🔄","Unit Converter","Converters","Length, weight आदि convert करें","unit"],
["🔤","Number to Words","Other Tools","Number को words में बदलें","numwords"]
];

const grid=document.getElementById("grid"), search=document.getElementById("search"), count=document.getElementById("count");
function render(q=""){
 const list=tools.filter(t=>t.join(" ").toLowerCase().includes(q.toLowerCase()));
 count.textContent=`${list.length} tools`;
 grid.innerHTML=list.map(t=>`<article class="card" onclick="openTool('${t[4]}','${t[1]}','${t[3]}')"><div class="icon">${t[0]}</div><h3>${t[1]}</h3><p>${t[3]}</p><span class="badge">${t[2]}</span></article>`).join("");
}
search.addEventListener("input",e=>render(e.target.value)); render();

const modal=document.getElementById("modal"), content=document.getElementById("toolContent");
document.getElementById("close").onclick=()=>modal.classList.add("hidden");
modal.onclick=e=>{if(e.target===modal)modal.classList.add("hidden")};

function openTool(type,title,desc){
 modal.classList.remove("hidden");
 content.innerHTML=`<h2>${title}</h2><p>${desc}</p>${toolUI(type)}`;
 bind(type);
}
function toolUI(type){
 if(["jpgpdf","jpgpng","pngjpg","compress","resize"].includes(type))
 return `<div class="drop"><input id="file" type="file" accept="image/*"><p>File चुनें और नीचे action करें</p></div><button class="btn" id="action">Process</button><div id="out"></div>`;
 if(type==="words") return `<textarea id="txt" style="width:100%;height:180px;padding:12px" placeholder="अपना text यहाँ paste करें"></textarea><div id="out" class="result">Words: 0 | Characters: 0</div>`;
 if(type==="case") return `<textarea id="txt" style="width:100%;height:180px;padding:12px"></textarea><div class="row"><button class="btn" id="upper">UPPERCASE</button><button class="btn" id="lower">lowercase</button></div>`;
 if(type==="percent") return `<input id="a" type="number" placeholder="Number"><input id="b" type="number" placeholder="%"><button class="btn" id="calc">Calculate</button><div id="out"></div>`;
 if(type==="emi") return `<input id="a" type="number" placeholder="Loan amount"><input id="b" type="number" placeholder="Annual interest %"><input id="c" type="number" placeholder="Months"><button class="btn" id="calc">Calculate EMI</button><div id="out"></div>`;
 if(type==="discount") return `<input id="a" type="number" placeholder="Original price"><input id="b" type="number" placeholder="Discount %"><button class="btn" id="calc">Calculate</button><div id="out"></div>`;
 if(type==="gst") return `<input id="a" type="number" placeholder="Amount"><input id="b" type="number" placeholder="GST %"><button class="btn" id="calc">Calculate</button><div id="out"></div>`;
 if(type==="bmi") return `<input id="a" type="number" placeholder="Weight kg"><input id="b" type="number" placeholder="Height cm"><button class="btn" id="calc">Calculate BMI</button><div id="out"></div>`;
 if(type==="password") return `<button class="btn" id="gen">Generate Password</button><div id="out" class="result"></div>`;
 if(type==="qr") return `<input id="txt" style="width:100%;padding:12px" placeholder="URL या text"><button class="btn" id="calc">Generate QR</button><div id="out"></div>`;
 return `<div class="result">यह tool अगले development phase में जोड़ा जाएगा।</div>`;
}
function bind(type){
 const out=document.getElementById("out");
 const file=document.getElementById("file");
 if(file) document.getElementById("action").onclick=()=>processImage(type,file.files[0],out);
 const txt=document.getElementById("txt");
 if(type==="words") txt.oninput=()=>out.textContent=`Words: ${txt.value.trim()?txt.value.trim().split(/\s+/).length:0} | Characters: ${txt.value.length}`;
 if(type==="case"){document.getElementById("upper").onclick=()=>txt.value=txt.value.toUpperCase();document.getElementById("lower").onclick=()=>txt.value=txt.value.toLowerCase();}
 if(["percent","discount","gst","bmi","emi"].includes(type))document.getElementById("calc").onclick=()=>calculate(type,out);
 if(type==="password")document.getElementById("gen").onclick=()=>out.textContent=Array.from(crypto.getRandomValues(new Uint32Array(18)),n=>"ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%"[n%66]).join("");
 if(type==="qr")document.getElementById("calc").onclick=()=>{let v=encodeURIComponent(txt.value);out.innerHTML=`<img alt="QR Code" style="max-width:260px" src="https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${v}"><p>QR image ऊपर दिखाई देगी।</p>`};
}
function calculate(type,out){
 const a=+document.getElementById("a").value,b=+document.getElementById("b").value;
 if(type==="percent")out.innerHTML=`<div class="result">${(a*b/100).toFixed(2)}</div>`;
 if(type==="discount")out.innerHTML=`<div class="result">Final Price: ₹${(a-(a*b/100)).toFixed(2)}</div>`;
 if(type==="gst")out.innerHTML=`<div class="result">GST: ₹${(a*b/100).toFixed(2)}<br>Total: ₹${(a+a*b/100).toFixed(2)}</div>`;
 if(type==="bmi"){let h=+document.getElementById("b").value/100;out.innerHTML=`<div class="result">BMI: ${(a/(h*h)).toFixed(2)}</div>`}
 if(type==="emi"){let p=a,r=b/12/100,n=+document.getElementById("c").value;let e=p*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1);out.innerHTML=`<div class="result">Monthly EMI: ₹${e.toFixed(2)}</div>`}
}
async function processImage(type,file,out){
 if(!file){out.textContent="पहले file चुनें।";return}
 if(type==="jpgpng"||type==="pngjpg"){const url=URL.createObjectURL(file);const im=new Image();im.onload=()=>{const c=document.createElement("canvas");c.width=im.width;c.height=im.height;c.getContext("2d").drawImage(im,0,0);c.toBlob(blob=>download(blob,type==="jpgpng"?"converted.png":"converted.jpg"),type==="jpgpng"?"image/png":"image/jpeg",.92)};im.src=url;out.innerHTML="<div class='result'>Conversion complete — download शुरू हो जाएगा।</div>";return}
 if(type==="compress"){const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{const max=1400,s=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement("canvas");c.width=im.width*s;c.height=im.height*s;c.getContext("2d").drawImage(im,0,0,c.width,c.height);c.toBlob(b=>download(b,"compressed.jpg"),"image/jpeg",.65)};im.src=url;out.innerHTML="<div class='result'>Image compressed — download शुरू हो जाएगा।</div>";return}
 if(type==="resize"){const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{const w=+prompt("नई width (px)",im.width);if(!w)return;const h=Math.round(im.height*w/im.width),c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);c.toBlob(b=>download(b,"resized.jpg"),"image/jpeg",.9)};im.src=url;return}
 if(type==="jpgpdf"){out.innerHTML="<div class='result'>JPG → PDF के लिए PDF engine जोड़ना अगला step है।</div>";}
}
function download(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}