/* 006、007整页图片适配：优先读取上海图书馆IIIF原图，历史分支作为回退。 */
(function(){
  "use strict";
  if(window.__WORK_REMOTE_IMAGE_ADAPTER__)return;
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const id=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(!["006","007"].includes(id))return;
  window.__WORK_REMOTE_IMAGE_ADAPTER__=true;

  const RAW_BASE="https://raw.githubusercontent.com/SphinxL97/SphinxL97.github.io/image-assets/";
  const PREFIX=id==="006"?"assets/page_images/006_史晨后碑/":"assets/page_images/007_伊阙佛龛碑/";
  const MANIFEST_URL=id==="006"
    ?"https://iiif.library.sh.cn/p/3/26aeaedb-6c05-11ee-939e-9cb6d0bbaaae"
    :"https://iiif.library.sh.cn/p/3/26aeaed6-6c05-11ee-bab6-9cb6d0bbaaae";

  let iiifImages=[];
  let manifestReady=false;

  function asArray(value){return Array.isArray(value)?value:(value?[value]:[])}

  function relativePath(value){
    let text=String(value||"").trim();
    if(!text)return "";
    if(text.startsWith(RAW_BASE))return decodeURIComponent(text.slice(RAW_BASE.length).split("?")[0].split("#")[0]);
    try{
      const url=new URL(text,location.href);
      if(url.origin===location.origin)text=decodeURIComponent(url.pathname.replace(/^\/+/,""));
      else text=decodeURIComponent(url.pathname.replace(/^\/+/,""));
    }catch(_){ }
    return text.replace(/^\.\//,"").replace(/^\/+/,"").split("?")[0].split("#")[0];
  }

  function pageNumber(value){
    const text=relativePath(value);
    const match=text.match(/(?:^|\/)(\d{4})_[^/]+\.(?:jpg|jpeg|png|webp)$/i);
    if(match)return Number(match[1]);
    const fallback=text.match(/(?:page[_-]?|canvas[_-]?)(\d{1,4})/i);
    return fallback?Number(fallback[1]):0;
  }

  function rawFallback(value){
    const rel=relativePath(value);
    if(!rel||!rel.startsWith(PREFIX))return String(value||"");
    return RAW_BASE+rel.split("/").map(part=>encodeURIComponent(part)).join("/");
  }

  function imageIdFromBody(body){
    if(Array.isArray(body)){
      for(const item of body){const found=imageIdFromBody(item);if(found)return found;}
      return "";
    }
    if(!body||typeof body!=="object")return "";
    const direct=body.id||body["@id"];
    if(typeof direct==="string"&&/^https?:\/\//i.test(direct))return direct;
    return imageIdFromBody(body.items)||imageIdFromBody(body.resource);
  }

  function imagesFromManifest(manifest){
    const result=[];
    const canvases=Array.isArray(manifest?.items)
      ?manifest.items
      :(Array.isArray(manifest?.sequences?.[0]?.canvases)?manifest.sequences[0].canvases:[]);
    canvases.forEach(canvas=>{
      let found="";
      for(const annotationPage of asArray(canvas?.items)){
        for(const annotation of asArray(annotationPage?.items)){
          found=imageIdFromBody(annotation?.body);
          if(found)break;
        }
        if(found)break;
      }
      if(!found){
        for(const annotation of asArray(canvas?.images)){
          found=imageIdFromBody(annotation?.resource||annotation?.body);
          if(found)break;
        }
      }
      if(found)result.push(found);
    });
    return result;
  }

  function remoteUrl(value,indexHint=0){
    const number=pageNumber(value)||Number(indexHint)||0;
    if(number>0&&iiifImages[number-1])return iiifImages[number-1];
    return rawFallback(value);
  }

  window.BEITIE_REMOTE_IMAGE_URL=value=>remoteUrl(value);

  async function loadManifest(){
    try{
      const response=await fetch(MANIFEST_URL,{cache:"force-cache"});
      if(!response.ok)throw new Error(`${MANIFEST_URL} ${response.status}`);
      iiifImages=imagesFromManifest(await response.json());
      if(!iiifImages.length)throw new Error("IIIF manifest 中未找到图片地址");
      manifestReady=true;
      document.dispatchEvent(new CustomEvent("beitie:remote-images-ready",{detail:{id,count:iiifImages.length}}));
      return true;
    }catch(error){
      manifestReady=true;
      console.warn(`[remote-image] ${id} IIIF图像读取失败，使用历史图片分支回退`,error);
      return false;
    }
  }

  function patchRecord(record,indexHint=0){
    if(!record||typeof record!=="object")return;
    const ownIndex=Number(record.canvas_index||record.page||record.page_no||indexHint)||indexHint;
    if(record.image)record.image=remoteUrl(record.image,ownIndex);
    if(record.local_image)record.local_image=remoteUrl(record.local_image,ownIndex);
    if(Array.isArray(record.items))record.items.forEach(item=>patchRecord(item,ownIndex));
  }

  function patchReaderPages(){
    try{
      if(typeof pages==="undefined"||!Array.isArray(pages)||!pages.length)return false;
      pages.forEach((record,index)=>patchRecord(record,index+1));
      const cover=document.getElementById("heroCover");
      if(cover&&pages[0]?.image)cover.src=pages[0].image;
      if(typeof loadPage==="function"){
        const index=typeof currentPageIndex==="number"?currentPageIndex:0;
        loadPage(index);
      }
      return true;
    }catch(error){
      console.warn("[remote-image] reader patch",error);
      return false;
    }
  }

  function patchVisual(node){
    if(!(node instanceof Element))return;
    if(node.hasAttribute("data-image")){
      const current=node.getAttribute("data-image")||"";
      const next=remoteUrl(current);
      if(next&&next!==current)node.setAttribute("data-image",next);
    }
    if(node instanceof HTMLImageElement){
      const current=node.getAttribute("src")||node.src;
      const next=remoteUrl(current);
      if(next&&next!==current)node.setAttribute("src",next);
      return;
    }
    if(node.tagName&&node.tagName.toLowerCase()==="image"){
      const current=node.getAttribute("href")||node.getAttribute("xlink:href")||"";
      const next=remoteUrl(current);
      if(next&&next!==current){
        node.setAttribute("href",next);
        node.setAttributeNS("http://www.w3.org/1999/xlink","href",next);
      }
    }
  }

  function patchTree(root){
    if(!(root instanceof Element))return;
    patchVisual(root);
    root.querySelectorAll("img,svg image,[data-image]").forEach(patchVisual);
  }

  function patchAllDynamicImages(){
    [document.getElementById("people"),document.getElementById("places")].filter(Boolean).forEach(patchTree);
  }

  function installDynamicImagePatch(){
    const roots=[document.getElementById("people"),document.getElementById("places")].filter(Boolean);
    if(roots.length<2){setTimeout(installDynamicImagePatch,120);return;}
    roots.forEach(patchTree);
    roots.forEach(root=>{
      const observer=new MutationObserver(records=>{
        records.forEach(record=>{
          if(record.type==="attributes")patchVisual(record.target);
          record.addedNodes.forEach(node=>{if(node instanceof Element)patchTree(node);});
        });
      });
      observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:["src","href","data-image"]});
    });
  }

  const manifestPromise=loadManifest();
  let attempts=0;
  const timer=setInterval(async()=>{
    attempts+=1;
    if(!manifestReady)return;
    await manifestPromise;
    if(patchReaderPages()||attempts>=150)clearInterval(timer);
  },100);

  manifestPromise.then(()=>{
    patchReaderPages();
    patchAllDynamicImages();
  });

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installDynamicImagePatch,{once:true});
  else installDynamicImagePatch();
})();