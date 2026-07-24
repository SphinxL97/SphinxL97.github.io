/* 027《旧拓魏志五种》逐页真实坐标与候选字校正适配。 */
(function(){
  "use strict";
  const raw=String(new URLSearchParams(location.search).get("id")||"001");
  const workId=(raw.includes("-")?raw.split("-")[0]:raw).padStart(3,"0");
  if(workId!=="027"||window.__WORK_027_COORDINATE_ADAPTER__)return;

  const CACHE_TAG="20260724_wei_five_v5";
  const ROOT="data/glyph_boxes/iiif/027";
  const originalLoader=typeof window.loadPageGlyphBoxes==="function"?window.loadPageGlyphBoxes:null;
  const pagePromises=new Map();
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  const CORRECTIONS=[
    {original:"泱泱顯□□□，西垂代襲。",candidate:"族斂蔓",mode:"documentary",source:"《全後魏文》卷五十七及《碑版文廣例》所录“泱泱顯族，斂蔓西垂”"},
    {original:"棲真宅正，□縄履程。",candidate:"寢",mode:"documentary",source:"《全後魏文》卷五十七所录“棲真宅正，寢繩履程”"},
    {original:"餝轅□帶。",candidate:"褫",mode:"documentary",source:"《全後魏文》卷五十七所录“飾轅褫帶”"},
    {original:"士女承□□；頓方馳盡，圡悲愁。",candidate:"休轡",mode:"documentary",source:"《全後魏文》卷五十七所录“士女承休，轡頓方馳”"},
    {original:"端恭妄□，家俗虚膺。",candidate:"砥",mode:"documentary",source:"《全後魏文》卷五十七所录“端恭妄砥”"},
    {original:"義成王南計□安。",candidate:"萇",mode:"documentary",source:"刘玉墓志公开录文所见地名“萇安”"},
    {original:"□□□基，雲景神䌽重暎。",candidate:"遠祖肇",mode:"ai_provisional",source:"公开录文“肇基雲景”及本句三个连续残位的句法推定"},
    {original:"巍□□□□□□墓□。",candidate:"巍然玄宅永固門",mode:"ai_provisional",source:"墓志结尾“玄宅”“永固墓门”常用语及现存字序推定"},
    {original:"魏□二字、海□二字、君墓銘五字完整",candidate:"故郡",mode:"ai_provisional",source:"后跋所考篆额“魏故勃海郡王君墓銘”及分组语境推定"},
    {original:"□□□亦可騐物之顯晦有定時也。",candidate:"庶幾此",mode:"ai_provisional",source:"清代金石后跋常用语“庶幾……亦可驗”及本句语法推定"}
  ];

  const escapeRegExp=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  function fill(original,candidate){
    let index=0;
    return Array.from(original).map(ch=>ch==="□"?`〔${candidate[index++]||"某"}〕`:ch).join("");
  }
  function plain(value){return String(value||"").replace(/[〔〕]/g,"");}
  function correctionFor(original){return CORRECTIONS.find(item=>String(original||"").includes(item.original));}
  function correctionPattern(original){
    const parts=String(original).split("□").map(escapeRegExp);
    return new RegExp(parts.join("〔[^〕]+〕"));
  }
  function transformText(text){
    let value=String(text||"");
    CORRECTIONS.forEach(item=>{
      value=value.replace(correctionPattern(item.original),fill(item.original,item.candidate));
    });
    return value;
  }
  function transformCases(rows){
    return (Array.isArray(rows)?rows:[]).map(row=>{
      const item=correctionFor(row.original||row.o);
      if(!item)return row;
      const corrected=fill(String(row.original||row.o||""),item.candidate);
      const category=item.mode==="documentary"?"文献对校":"AI暂拟";
      const confidence=item.mode==="documentary"?"较高":"中";
      return {...row,
        candidate:item.candidate,
        candidate_count:item.candidate.length,
        corrected,
        c:corrected,
        current_context:plain(corrected),
        remaining_square_count:0,
        mode:item.mode,
        category,
        confidence,
        reference:item.source,
        analysis:[
          `本例原句含${item.candidate.length}个残损方框，依次拟补为“${item.candidate}”。补入后当前上下文为“${plain(corrected)}”。`,
          `${item.source}。候选字与第${row.page||row.locations?.[0]?.page||"—"}页方框的先后顺序逐一对应。`,
          item.mode==="documentary"?"该结果有对应录文支持；网站仍以〔〕标出补入文字，不把整理结果冒充原石现存字迹。":"该结果属于语境推定；现有公开录文未完整保存全部残位，网站明确标为AI暂拟，供后续结合原拓和其他著录复核。"
        ]
      };
    });
  }

  if(!window.__WORK_027_DATA_CORRECTION_FETCH__){
    window.__WORK_027_DATA_CORRECTION_FETCH__=true;
    const nativeFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      const url=typeof input==="string"?input:String(input?.url||"");
      const response=await nativeFetch(input,init);
      if(!response.ok)return response;
      if(url.includes("data/work027_full_text.txt")){
        const text=transformText(await response.text());
        return new Response(text,{status:response.status,statusText:response.statusText,headers:response.headers});
      }
      if(url.includes("data/work027_damage_cases.json")){
        const rows=transformCases(await response.json());
        return new Response(JSON.stringify(rows),{status:response.status,statusText:response.statusText,headers:{"Content-Type":"application/json; charset=utf-8"}});
      }
      return response;
    };
  }

  function rect(row){return {x:Number(row.x??row.bbox_x??row.bbox?.[0]??0),y:Number(row.y??row.bbox_y??row.bbox?.[1]??0),w:Number(row.w??row.bbox_w??row.bbox?.[2]??0),h:Number(row.h??row.bbox_h??row.bbox?.[3]??0)};}
  function normalizeRow(row,page,index){
    const box=rect(row);if(box.w<=0||box.h<=0)return null;
    const pageNo=Number(row.canvas_index||row.page||page||0);if(!pageNo)return null;
    const text=String(row.char||row.text||"").slice(0,1);
    return {...row,work_id:"027",canvas_index:pageNo,glyph_id:String(row.glyph_id||`027_${pageNo}_${index+1}`),char:text,text,order_in_page:Number(row.order_in_page||row.annotation_index||index+1),bbox_x:box.x,bbox_y:box.y,bbox_w:box.w,bbox_h:box.h,bbox:[box.x,box.y,box.w,box.h]};
  }
  async function fetchRows(page){
    const pageNo=Number(page||0);if(!pageNo)return [];
    if(pagePromises.has(pageNo))return pagePromises.get(pageNo);
    const promise=(async()=>{
      const url=`${ROOT}/page_${String(pageNo).padStart(4,"0")}.json?v=${CACHE_TAG}`;
      let lastError=null;
      for(let attempt=1;attempt<=3;attempt+=1){
        try{
          const response=await fetch(url,{cache:attempt===1?"force-cache":"reload"});
          if(response.status===404)return [];
          if(!response.ok)throw new Error(`${response.status} ${response.statusText}`);
          const rows=await response.json();
          return (Array.isArray(rows)?rows:[]).map((row,index)=>normalizeRow(row,pageNo,index)).filter(Boolean).sort((a,b)=>a.order_in_page-b.order_in_page);
        }catch(error){lastError=error;if(attempt<3)await sleep(350*attempt);}
      }
      throw lastError||new Error("027坐标读取失败");
    })().catch(error=>{pagePromises.delete(pageNo);console.warn("[work-027-coordinate-adapter]",pageNo,error);return [];});
    pagePromises.set(pageNo,promise);return promise;
  }
  window.loadPageGlyphBoxes=async function(id,pageObj){
    const normalized=String(id||"").match(/^(\d{3})/)?.[1]||String(id||"").padStart(3,"0");
    if(normalized!=="027")return originalLoader?originalLoader(id,pageObj):[];
    const page=Number(pageObj?.canvas_index||pageObj?.page||0);
    const rows=(await fetchRows(page)).map(row=>({...row,local_image:pageObj?.image||row.local_image||""}));
    if(rows.length)return rows;
    return originalLoader?originalLoader(id,pageObj):[];
  };
  window.WORK_027_COORDINATES={loadPageRows:fetchRows};
  window.__WORK_027_COORDINATE_ADAPTER__=true;
  window.dispatchEvent(new CustomEvent("work-027-coordinate-adapter-ready"));
})();
