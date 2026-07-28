(function(){
  "use strict";

  const ICONS = Object.freeze({
    script:"assets/ui/reading-icons/script.svg?v=20260728_v2",
    type:"assets/ui/reading-icons/type.svg?v=20260728_v2",
    dynasty:"assets/ui/reading-icons/dynasty.svg?v=20260728_v3",
    author:"assets/ui/reading-icons/author.svg?v=20260728_v5",
    writer:"assets/ui/reading-icons/writer.svg?v=20260728_v2",
    copy_era:"assets/ui/reading-icons/copy-era.svg?v=20260728_v3",
    theme:"assets/ui/reading-icons/theme.svg?v=20260728_v2"
  });

  let scheduled = false;

  function makeImage(key){
    const src = ICONS[key];
    if(!src) return null;
    const image = document.createElement("img");
    image.src = src;
    image.alt = "";
    image.setAttribute("aria-hidden","true");
    image.decoding = "async";
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = "contain";
    image.style.display = "block";
    return image;
  }

  function replaceHolder(holder,key){
    if(!holder || !ICONS[key] || holder.dataset.readingIcon === key) return;
    const image = makeImage(key);
    if(!image) return;
    holder.replaceChildren(image);
    holder.dataset.readingIcon = key;
    holder.style.overflow = "hidden";
  }

  function applyIcons(){
    scheduled = false;

    document.querySelectorAll(".category-button[data-category]").forEach(button=>{
      replaceHolder(button.querySelector(".category-icon"),button.dataset.category);
    });

    const activeKey = document.querySelector(".category-button.active[data-category]")?.dataset.category || "script";
    document.querySelectorAll("#readingGroups .group-mark").forEach(holder=>{
      replaceHolder(holder,activeKey);
      holder.style.background = "#fffaf1";
    });
  }

  function scheduleApply(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(applyIcons);
  }

  const observer = new MutationObserver(scheduleApply);
  const categoryStrip = document.getElementById("categoryStrip");
  const readingGroups = document.getElementById("readingGroups");

  if(categoryStrip){
    observer.observe(categoryStrip,{childList:true,subtree:true,attributes:true,attributeFilter:["class"]});
  }
  if(readingGroups){
    observer.observe(readingGroups,{childList:true,subtree:true});
  }

  scheduleApply();
})();