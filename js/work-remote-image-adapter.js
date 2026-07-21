/* 006、007图片迁出Pages发布目录后的路径适配。 */
(function(){
  "use strict";
  if(window.__WORK_REMOTE_IMAGE_ADAPTER__)return;
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const id=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(!["006","007"].includes(id))return;
  window.__WORK_REMOTE_IMAGE_ADAPTER__=true;

  const BASE="https://raw.githubusercontent.com/SphinxL97/SphinxL97.github.io/image-assets/";
  const PREFIX=id==="006"?"assets/page_images/006_史晨后碑/":"assets/page_images/007_伊阙佛龛碑/";

  function relativePath(value){
    let text=String(value||"").trim();
    if(!text)return "";
    if(text.startsWith(BASE))return text.slice(BASE.length).split("?")[0].split("#")[0];
    try{
      const url=new URL(text,location.href);
      if(url.origin===location.origin)text=decodeURIComponent(url.pathname.replace(/^\/+/,""));
    }catch(_){ }
    return text.replace(/^\.\//,"").replace(/^\/+/,"").split("?")[0].split("#")[0];
  }

  function remoteUrl(value){
    const rel=relativePath(value);
    if(!rel||!rel.startsWith(PREFIX))return String(value||"");
    return BASE+rel.split("/").map(part=>encodeURIComponent(part)).join("/");
  }

  window.BEITIE_REMOTE_IMAGE_URL=remoteUrl;

  function patchRecord(record){
    if(!record||typeof record!=="object")return;
    if(record.image)record.image=remoteUrl(record.image);
    if(record.local_image)record.local_image=remoteUrl(record.local_image);
    if(Array.isArray(record.items))record.items.forEach(patchRecord);
  }

  function patchReaderPages(){
    try{
      if(typeof pages==="undefined"||!Array.isArray(pages)||!pages.length)return false;
      pages.forEach(patchRecord);
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

  let attempts=0;
  const timer=setInterval(()=>{
    attempts+=1;
    if(patchReaderPages()||attempts>=100)clearInterval(timer);
  },100);

  function patchImage(image){
    if(!(image instanceof HTMLImageElement))return;
    const next=remoteUrl(image.getAttribute("src")||image.src);
    if(next&&next!==image.src&&next!==image.getAttribute("src"))image.src=next;
  }

  function installCrowdsourceImagePatch(){
    const root=document.getElementById("places");
    if(!root){setTimeout(installCrowdsourceImagePatch,120);return;}
    root.querySelectorAll("img").forEach(patchImage);
    const observer=new MutationObserver(records=>{
      records.forEach(record=>{
        if(record.type==="attributes")patchImage(record.target);
        record.addedNodes.forEach(node=>{
          if(node instanceof HTMLImageElement)patchImage(node);
          else if(node instanceof Element)node.querySelectorAll("img").forEach(patchImage);
        });
      });
    });
    observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",installCrowdsourceImagePatch,{once:true});
  else installCrowdsourceImagePatch();
})();