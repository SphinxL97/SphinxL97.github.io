/* 众智释读三个独立表单的 Formspree 地址。
 * 后续仅需把空字符串替换为对应的 Formspree endpoint。
 * 不要在本文件中填写邮箱密码、SMTP 密码或授权码。
 */
window.FORM_ENDPOINTS=Object.freeze({
  transcription:"",
  punctuation:"",
  missingText:""
});

/* 统一校正界面提示语；不改变任何表单数据或交互逻辑。 */
document.addEventListener("DOMContentLoaded",()=>{
  setTimeout(()=>{
    document.querySelectorAll(".crowd-pane .crowd-hint").forEach(node=>{
      if(node.textContent.includes("点击右侧碑帖图片")){
        node.textContent=node.textContent.replace("点击右侧碑帖图片","点击左侧碑帖图片");
      }
    });
  },0);
});
