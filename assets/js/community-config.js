/* 公开校订意见配置。
 * mode="demo"：使用内置示例数据，投票只保存在当前浏览器。
 * mode="supabase"：读取 Supabase 中已审核意见，并启用所有访问者共享的实时投票。
 * supabaseKey 应填写 publishable key（或旧版 anon key）。
 * 绝对不要填写 secret key 或 service_role key。
 */
window.COMMUNITY_CONFIG=Object.freeze({
  mode:"demo",
  supabaseUrl:"",
  supabaseKey:"",
  pageSize:6,
  realtime:true
});
