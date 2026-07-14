/* 公开校订意见配置。
 * mode="demo"：使用内置示例数据，投票只保存在当前浏览器。
 * mode="supabase"：读取 Supabase 中已审核意见，并启用共享实时投票。
 * supabaseAnonKey 是浏览器公开密钥，不要填写 service_role key。
 */
window.COMMUNITY_CONFIG=Object.freeze({
  mode:"demo",
  supabaseUrl:"",
  supabaseAnonKey:"",
  pageSize:6,
  realtime:true
});
