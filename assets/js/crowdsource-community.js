(function(){
  "use strict";
  if(window.__CROWDSOURCE_COMMUNITY__) return;
  window.__CROWDSOURCE_COMMUNITY__=true;

  const config=window.COMMUNITY_CONFIG||{};
  const state={items:[],filter:"all",sort:"latest",client:null,channel:null};
  const WORK_ID=String(new URLSearchParams(location.search).get("id")||"001");
  const PUBLIC_WORK_ID=WORK_ID.split("-")[0].padStart(3,"0");
  const VOTER_KEY="crowd-community-voter-id";
  const VOTE_KEY=`crowd-community-votes:${WORK_ID}`;

  const demoItems=[
    {id:"demo-transcription-1",work_id:"001",type:"transcription",page_no:8,line_no:12,column_no:5,current_text:"德",suggested_text:"首",reason:"根据字形上部结构及上下文判断，此处更接近“首”。",reference_text:"某拓本第8页",nickname:"墨缘",created_at:"2026-07-14T08:00:00Z",up_count:12,down_count:3},
    {id:"demo-transcription-2",work_id:"001",type:"transcription",page_no:9,line_no:3,column_no:7,current_text:"以",suggested_text:"之",reason:"结合句意，前后语气衔接更通顺，应为“之”。",reference_text:"某拓本第9页",nickname:"清风",created_at:"2026-07-13T08:00:00Z",up_count:8,down_count:2},
    {id:"demo-punctuation-1",work_id:"001",type:"punctuation",page_no:11,line_no:1,column_no:null,current_text:"大哉乾元，播物垂象。肇有书契，文籍生焉。",suggested_text:"大哉乾元，播物垂象；肇有书契，文籍生焉。",reason:"前后两层语意相承，使用分号更能体现句间关系。",reference_text:"依据文意与骈文节奏",nickname:"云中鹤",created_at:"2026-07-14T03:00:00Z",up_count:15,down_count:1}
  ];

  function qs(selector,root=document){return root.querySelector(selector);}
  function qsa(selector,root=document){return Array.from(root.querySelectorAll(selector));}
  function clean(value){return String(value==null?"":value).trim();}
  function getVoterId(){
    let id=localStorage.getItem(VOTER_KEY);
    if(!id){id=(crypto.randomUUID?crypto.randomUUID():`v_${Date.now()}_${Math.random().toString(36).slice(2)}`);localStorage.setItem(VOTER_KEY,id);}
    return id;
  }
  function getLocalVotes(){try{return JSON.parse(localStorage.getItem(VOTE_KEY)||"{}");}catch(_){return {};}}
  function setLocalVotes(votes){localStorage.setItem(VOTE_KEY,JSON.stringify(votes));}
  function typeName(type){return type==="transcription"?"释文校订":type==="punctuation"?"标点校订":"缺字补录";}
  function dateText(value){try{return new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));}catch(_){return clean(value).slice(0,10);}}
  function controversy(item){const total=Number(item.up_count||0)+Number(item.down_count||0);return total-Math.abs(Number(item.up_count||0)-Number(item.down_count||0));}

  function waitForExistingModule(){
    return new Promise(resolve=>{
      const ready=()=>{
        const section=qs('#places[data-crowdsource-ready="true"]');
        const shell=section&&qs(".crowd-shell",section);
        if(section&&shell){resolve({section,shell});return true;}
        return false;
      };
      if(ready()) return;
      const observer=new MutationObserver(()=>{if(ready())observer.disconnect();});
      observer.observe(document.documentElement,{childList:true,subtree:true});
      setTimeout(()=>{observer.disconnect();const section=qs("#places"),shell=section&&qs(".crowd-shell",section);resolve({section,shell});},7000);
    });
  }

  function buildLayout(shell){
    if(!shell||qs(".crowd-community",shell)) return qs(".crowd-community",shell);
    const root=document.createElement("section");root.className="crowd-community";root.innerHTML=`
      <div class="crowd-community-head">
        <div><h3 class="crowd-community-title">诸家汇校</h3><p class="crowd-community-desc">仅展示经管理员审核通过的意见。联系邮箱不会公开显示。</p></div>
      </div>
      <div class="crowd-community-toolbar">
        <div class="crowd-community-filters" aria-label="意见类型筛选">
          <button class="crowd-community-filter active" data-community-filter="all" type="button">全部</button>
          <button class="crowd-community-filter" data-community-filter="transcription" type="button">释文校订</button>
          <button class="crowd-community-filter" data-community-filter="punctuation" type="button">标点校订</button>
          <button class="crowd-community-filter" data-community-filter="missingText" type="button">缺字补录</button>
        </div>
        <div class="crowd-community-sort"><span>排序：</span>
          <button class="crowd-community-sort-btn active" data-community-sort="latest" type="button">最新</button>
          <button class="crowd-community-sort-btn" data-community-sort="popular" type="button">认同最多</button>
          <button class="crowd-community-sort-btn" data-community-sort="controversial" type="button">争议较大</button>
        </div>
      </div>
      <div class="crowd-community-list" data-community-list></div>
      <div class="crowd-community-foot"><span data-community-count></span><span>点击“查看原碑页”可返回上方释文校订图像。</span></div>`;
    shell.appendChild(root);
    qsa("[data-community-filter]",root).forEach(btn=>btn.addEventListener("click",()=>{state.filter=btn.dataset.communityFilter;syncButtons(root);render(root);}));
    qsa("[data-community-sort]",root).forEach(btn=>btn.addEventListener("click",()=>{state.sort=btn.dataset.communitySort;syncButtons(root);render(root);}));
    return root;
  }

  function syncButtons(root){
    qsa("[data-community-filter]",root).forEach(btn=>btn.classList.toggle("active",btn.dataset.communityFilter===state.filter));
    qsa("[data-community-sort]",root).forEach(btn=>btn.classList.toggle("active",btn.dataset.communitySort===state.sort));
  }

  function visibleItems(){
    let items=state.items.filter(item=>state.filter==="all"||item.type===state.filter);
    items=[...items].sort((a,b)=>{
      if(state.sort==="popular") return Number(b.up_count||0)-Number(a.up_count||0);
      if(state.sort==="controversial") return controversy(b)-controversy(a);
      return new Date(b.created_at||0)-new Date(a.created_at||0);
    });
    return items;
  }

  function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!=null)node.textContent=text;return node;}

  function render(root){
    const list=qs("[data-community-list]",root),count=qs("[data-community-count]",root);
    if(!list) return;
    const items=visibleItems();list.replaceChildren();count.textContent=`共 ${items.length} 条意见`;
    if(!items.length){list.appendChild(element("div","crowd-community-empty","当前筛选条件下暂无已审核意见。"));return;}
    const localVotes=getLocalVotes();
    items.forEach(item=>list.appendChild(buildCard(item,localVotes[item.id]||0,root)));
  }

  function buildCard(item,myVote,root){
    const card=element("article","crowd-community-card");
    const main=element("div","crowd-community-main");
    const meta=element("div","crowd-community-meta");
    meta.append(element("span",`crowd-community-type ${item.type}`,typeName(item.type)),element("span","crowd-community-approved","已审核"));
    const pos=[item.page_no?`第${item.page_no}页`:"",item.line_no?`第${item.line_no}行`:"",item.column_no?`第${item.column_no}列`:""].filter(Boolean).join(" · ");
    if(pos) meta.append(element("span","crowd-community-position",pos));
    main.appendChild(meta);
    const compare=element("div","crowd-community-compare");
    const current=element("div","crowd-community-box");current.append(element("b","",item.type==="punctuation"?"网站当前标点":"当前内容"),element("span","",item.current_text||"—"));
    const suggested=element("div","crowd-community-box");suggested.append(element("b","",item.type==="punctuation"?"建议标点":"建议修改"),element("span","",item.suggested_text||"—"));
    compare.append(current,suggested);main.appendChild(compare);
    const reason=element("div","crowd-community-reason");reason.append(element("b","","修改理由"),element("span","",item.reason||"未说明"));main.appendChild(reason);
    if(clean(item.reference_text)){const ref=element("div","crowd-community-reason");ref.append(element("b","","参考依据"),element("span","",item.reference_text));main.appendChild(ref);}

    const side=element("aside","crowd-community-side");
    const author=element("div","crowd-community-author");author.append(element("div","",`提交者：${item.nickname||"匿名读者"}`),element("div","",dateText(item.created_at)));
    const votes=element("div","crowd-community-votes");
    const up=element("button",`crowd-vote${myVote===1?" active":""}`,`👍 ${Number(item.up_count||0)}`);up.type="button";up.title="认同";
    const down=element("button",`crowd-vote${myVote===-1?" active":""}`,`👎 ${Number(item.down_count||0)}`);down.type="button";down.title="不认同";
    up.addEventListener("click",()=>vote(item,1,root));down.addEventListener("click",()=>vote(item,-1,root));votes.append(up,down);
    side.append(author,votes);
    if(item.page_no){const locate=element("button","crowd-community-locate","⌖ 查看原碑页");locate.type="button";locate.addEventListener("click",()=>locatePage(item));side.appendChild(locate);}
    card.append(main,side);return card;
  }

  async function vote(item,value,root){
    const votes=getLocalVotes(),current=Number(votes[item.id]||0),next=current===value?0:value;
    if(config.mode!=="supabase"){
      if(current===1)item.up_count=Math.max(0,Number(item.up_count||0)-1);
      if(current===-1)item.down_count=Math.max(0,Number(item.down_count||0)-1);
      if(next===1)item.up_count=Number(item.up_count||0)+1;
      if(next===-1)item.down_count=Number(item.down_count||0)+1;
      if(next)votes[item.id]=next;else delete votes[item.id];setLocalVotes(votes);render(root);return;
    }
    try{
      if(!state.client) throw new Error("Supabase 尚未连接");
      if(next===0){const {error}=await state.client.rpc("remove_community_vote",{p_suggestion_id:item.id,p_voter_id:getVoterId()});if(error)throw error;}
      else{const {error}=await state.client.rpc("cast_community_vote",{p_suggestion_id:item.id,p_voter_id:getVoterId(),p_vote_value:next});if(error)throw error;}
      if(next)votes[item.id]=next;else delete votes[item.id];setLocalVotes(votes);await loadSupabase(root);
    }catch(error){console.error("[community] vote failed",error);alert("投票暂时失败，请稍后重试。");}
  }

  function locatePage(item){
    const tab=qs('#places [data-tab="transcription"]');if(tab)tab.click();
    setTimeout(()=>{
      const select=qs('#places [data-page-select]');
      if(select&&item.page_no){select.value=String(Math.max(0,Number(item.page_no)-1));select.dispatchEvent(new Event("change",{bubbles:true}));}
      const stage=qs("#places .crowd-image-stage");if(stage){stage.scrollIntoView({behavior:"smooth",block:"center"});stage.animate([{boxShadow:"0 0 0 0 rgba(159,48,37,0)"},{boxShadow:"0 0 0 5px rgba(159,48,37,.32)"},{boxShadow:"0 0 0 0 rgba(159,48,37,0)"}],{duration:1400});}
    },160);
  }

  function loadSupabaseLibrary(){
    return new Promise((resolve,reject)=>{
      if(window.supabase&&window.supabase.createClient){resolve(window.supabase);return;}
      const script=document.createElement("script");script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";script.async=true;
      script.onload=()=>resolve(window.supabase);script.onerror=()=>reject(new Error("Supabase 客户端加载失败"));document.head.appendChild(script);
    });
  }

  async function loadSupabase(root){
    const {data,error}=await state.client.from("suggestions_public").select("*").eq("work_id",PUBLIC_WORK_ID).order("created_at",{ascending:false});
    if(error)throw error;state.items=Array.isArray(data)?data:[];render(root);
  }

  async function startSupabase(root){
    const publicKey=clean(config.supabaseKey||config.supabaseAnonKey);
    if(!clean(config.supabaseUrl)||!publicKey) throw new Error("community-config.js 尚未填写 Supabase URL 和 publishable key");
    const library=await loadSupabaseLibrary();state.client=library.createClient(config.supabaseUrl,publicKey);await loadSupabase(root);
    if(config.realtime!==false){
      state.channel=state.client.channel(`community-${PUBLIC_WORK_ID}`)
        .on("postgres_changes",{event:"*",schema:"public",table:"suggestion_vote_totals"},()=>loadSupabase(root).catch(console.error))
        .on("postgres_changes",{event:"*",schema:"public",table:"suggestions"},()=>loadSupabase(root).catch(console.error))
        .subscribe();
    }
  }

  function syncWithMainTabs(root){
    document.addEventListener("click",event=>{
      const btn=event.target.closest&&event.target.closest("#places .crowd-tab[data-tab]");if(!btn)return;
      const type=btn.dataset.tab;if(["transcription","punctuation","missingText"].includes(type)){state.filter=type;syncButtons(root);render(root);}
    });
  }

  async function init(){
    const {shell}=await waitForExistingModule();if(!shell)return;
    const root=buildLayout(shell);if(!root)return;syncWithMainTabs(root);
    if(config.mode==="supabase"){
      try{await startSupabase(root);}catch(error){console.error("[community] supabase init failed",error);qs("[data-community-list]",root).replaceChildren(element("div","crowd-community-error",`公开意见加载失败：${error.message}`));}
    }else{state.items=demoItems.filter(item=>item.work_id===PUBLIC_WORK_ID);render(root);}
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();