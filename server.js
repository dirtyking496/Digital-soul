import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||3000);
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".webmanifest":"application/manifest+json",".md":"text/markdown; charset=utf-8"};

function send(res,status,data,type="application/json; charset=utf-8"){
  res.writeHead(status,{"content-type":type,"x-content-type-options":"nosniff","cache-control":"no-store"});
  res.end(typeof data==="string"?data:JSON.stringify(data));
}
function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function makeProject(input){
  const name=escapeHtml(String(input.name||"Mon application").trim().slice(0,60));
  const description=escapeHtml(String(input.description||"Une application créée avec ForgePocket.").trim().slice(0,500));
  const kind=["landing","portfolio","notes"].includes(input.kind)?input.kind:"landing";
  const title=name||"Mon application";
  let html="";
  if(kind==="notes"){
    html=`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111827"><title>${title}</title>
<style>*{box-sizing:border-box}body{font:16px system-ui;background:#101827;color:#f8fafc;margin:0;padding:24px}.app{max-width:720px;margin:7vh auto;background:#1b2940;padding:26px;border-radius:18px}textarea{width:100%;min-height:110px;padding:12px;border-radius:9px;border:1px solid #475569;font:inherit}button{padding:11px 16px;border:0;border-radius:8px;background:#8274ff;color:white;font-weight:700;cursor:pointer}li{padding:12px;background:#26364f;border-radius:8px;margin:8px 0;display:flex;justify-content:space-between;gap:12px}li span{overflow-wrap:anywhere}.muted{color:#cbd5e1}</style></head>
<body><main class="app"><h1>${title}</h1><p class="muted">${description}</p><label for="note">Nouvelle note</label><textarea id="note" placeholder="Écris ta note ici…"></textarea><p><button id="add">Enregistrer la note</button></p><h2>Mes notes</h2><ul id="notes"></ul></main>
<script>
const field=document.getElementById("note"),list=document.getElementById("notes"),key="forgepocket-notes-${kind}";
let items=[];try{items=JSON.parse(localStorage.getItem(key)||"[]")}catch{items=[]}
function render(){list.replaceChildren();items.forEach((value,index)=>{const li=document.createElement("li"),span=document.createElement("span"),button=document.createElement("button");span.textContent=value;button.textContent="Supprimer";button.addEventListener("click",()=>{items.splice(index,1);persist()});li.append(span,button);list.append(li)})}
function persist(){localStorage.setItem(key,JSON.stringify(items));render()}
document.getElementById("add").addEventListener("click",()=>{const value=field.value.trim();if(!value)return;items.unshift(value);field.value="";persist()});render();
</script></body></html>`;
  }else if(kind==="portfolio"){
    html=`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<style>*{box-sizing:border-box}body{font:17px system-ui;background:#f1eee8;color:#20242c;margin:0;padding:8vh 8%}h1{font-size:clamp(40px,8vw,76px);margin:.2em 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;margin-top:36px}.card{background:white;padding:24px;border-radius:16px;box-shadow:0 8px 25px #0000000d}.tag{letter-spacing:.15em;font-size:12px;font-weight:800}</style></head>
<body><p class="tag">PORTFOLIO PERSONNEL</p><h1>${title}</h1><p>${description}</p><section class="grid"><article class="card"><h2>Projet 01</h2><p>Présente ici une réalisation et explique ton travail.</p></article><article class="card"><h2>Projet 02</h2><p>Ajoute une deuxième création à ton portfolio.</p></article><article class="card"><h2>Contact</h2><p>Ajoute tes coordonnées publiques pour être joint.</p></article></section></body></html>`;
  }else{
    html=`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#101827"><title>${title}</title>
<style>*{box-sizing:border-box}body{font:17px system-ui;background:#101827;color:white;margin:0}header{padding:22px 8%;border-bottom:1px solid #34435b}main{max-width:850px;margin:12vh auto;padding:25px}h1{font-size:clamp(42px,8vw,72px);line-height:1.05}p{color:#bdc9dc;line-height:1.7}.cta{display:inline-block;background:#8274ff;color:white;padding:13px 18px;border-radius:10px;text-decoration:none;font-weight:700}</style></head>
<body><header><strong>${title}</strong></header><main><p>PROJET CRÉÉ AVEC FORGEPOCKET</p><h1>${title}</h1><p>${description}</p><a class="cta" href="#details">Découvrir</a><section id="details"><h2>À propos</h2><p>Cette page est générée et peut être modifiée dans ForgePocket.</p></section></main></body></html>`;
  }
  const readme=`# ${String(input.name||"Mon application").trim()}\n\n${String(input.description||"Projet créé avec ForgePocket.").trim()}\n\n## Démarrage\n\nOuvre le fichier index.html dans un navigateur.\n\nProjet généré par ForgePocket.\n`;
  return {name:String(input.name||"Mon application").trim().slice(0,60),kind,files:{"index.html":html,"README.md":readme},generatedAt:new Date().toISOString()};
}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url||"/","http://localhost");
  if(req.method==="GET"&&url.pathname==="/api/health")return send(res,200,{ok:true,app:"ForgePocket",version:"0.2.0",generator:"server-side",payments:"disabled"});
  if(req.method==="GET"&&url.pathname==="/api/templates")return send(res,200,[{id:"landing",name:"Page professionnelle"},{id:"portfolio",name:"Portfolio"},{id:"notes",name:"Application de notes"}]);
  if(req.method==="POST"&&url.pathname==="/api/generate"){
    let body="";
    try{
      for await(const chunk of req){body+=chunk;if(body.length>20000)return send(res,413,{ok:false,error:"Description trop volumineuse"});}
      const input=JSON.parse(body);
      if(!input||typeof input!=="object"||Array.isArray(input))return send(res,400,{ok:false,error:"Données invalides"});
      const project=makeProject(input);
      return send(res,200,{ok:true,...project,fileCount:Object.keys(project.files).length,totalCharacters:Object.values(project.files).reduce((sum,value)=>sum+value.length,0)});
    }catch(error){return send(res,400,{ok:false,error:error instanceof SyntaxError?"JSON invalide":"Impossible de générer le projet"});}
  }
  if(req.method==="POST"&&url.pathname==="/api/validate"){
    let body="";
    try{
      for await(const chunk of req){body+=chunk;if(body.length>600000)return send(res,413,{ok:false,error:"Projet trop volumineux"});}
      const files=JSON.parse(body).files;
      if(!files||typeof files!=="object"||Array.isArray(files)||!Object.keys(files).length||Object.keys(files).length>30)return send(res,400,{ok:false,error:"Structure de projet invalide"});
      for(const [name,value] of Object.entries(files))if(typeof value!=="string"||value.length>500000||name.includes("..")||name.startsWith("/"))return send(res,400,{ok:false,error:"Fichier invalide"});
      return send(res,200,{ok:true,fileCount:Object.keys(files).length,totalCharacters:Object.values(files).reduce((sum,value)=>sum+value.length,0)});
    }catch{return send(res,400,{ok:false,error:"JSON invalide"});}
  }
  if(req.method!=="GET"&&req.method!=="HEAD")return send(res,405,{error:"Méthode non autorisée"});
  let pathname;
  try{pathname=decodeURIComponent(url.pathname)}catch{return send(res,400,{error:"Adresse invalide"});}
  if(pathname==="/")pathname="/index.html";
  const file=path.resolve(root,"."+pathname);
  if(!file.startsWith(root+path.sep))return send(res,403,{error:"Accès refusé"});
  fs.readFile(file,(error,data)=>{if(error)return send(res,404,"Introuvable","text/plain; charset=utf-8");res.writeHead(200,{"content-type":mime[path.extname(file)]||"application/octet-stream","cache-control":"no-cache","x-content-type-options":"nosniff"});res.end(req.method==="HEAD"?undefined:data);});
});
server.listen(port,"0.0.0.0",()=>console.log("ForgePocket actif sur "+port));
