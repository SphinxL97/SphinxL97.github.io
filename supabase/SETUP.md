# 众智释读共享实时投票配置

本说明用于把 `feature/community-suggestions` 分支中的“大家的校订意见”从演示模式切换为 Supabase 共享实时模式。

## 1. 创建 Supabase 项目

1. 登录 Supabase Dashboard。
2. 创建一个新项目，例如：`beitie-community`。
3. 保存好数据库密码；网站前端不会使用这个密码。
4. 等待项目初始化完成。

## 2. 建表与权限

1. 打开 Supabase 项目。
2. 进入 **SQL Editor**。
3. 新建查询。
4. 打开仓库中的 `supabase/community-schema.sql`。
5. 复制全部 SQL 到 SQL Editor。
6. 点击 **Run**。
7. 确认没有红色错误。

该脚本会创建：

- `suggestions`：校订意见；
- `suggestion_votes`：匿名投票明细；
- `suggestion_vote_totals`：公开票数汇总；
- `suggestions_public`：只展示 `approved` 意见的公开视图；
- 两个投票 RPC；
- RLS 策略；
- Realtime publication。

## 3. 取得前端可公开使用的连接信息

在 Supabase Dashboard 的项目连接区域或 **Settings > API Keys** 中复制：

- Project URL；
- Publishable key（`sb_publishable_...`），旧项目也可以使用 anon key。

不要复制：

- Secret key；
- `service_role` key；
- 数据库密码。

## 4. 填写 GitHub 配置

修改：

`assets/js/community-config.js`

改为：

```javascript
window.COMMUNITY_CONFIG=Object.freeze({
  mode:"supabase",
  supabaseUrl:"https://你的项目编号.supabase.co",
  supabaseKey:"sb_publishable_你的公开密钥",
  pageSize:6,
  realtime:true
});
```

## 5. 添加一条真实测试意见

进入 **Table Editor > suggestions > Insert row**，填写：

- `work_id`: `001`
- `type`: `transcription`
- `page_no`: `8`
- `line_no`: `12`
- `column_no`: `5`
- `current_text`: `德`
- `suggested_text`: `首`
- `reason`: `用于测试共享意见与投票。`
- `reference_text`: `测试数据`
- `nickname`: `测试读者`
- `status`: `approved`

保存后，这条数据才会在主站公开显示。`pending` 和 `rejected` 不会公开。

也可以在 SQL Editor 中执行：

```sql
insert into public.suggestions(
  work_id,type,page_no,line_no,column_no,
  current_text,suggested_text,reason,reference_text,nickname,status
) values (
  '001','transcription',8,12,5,
  '德','首','用于测试共享意见与投票。','测试数据','测试读者','approved'
);
```

## 6. 合并并发布

1. 将 PR #18 标记为 Ready for review。
2. 合并到 `main`。
3. 等待 GitHub Pages 部署完成。
4. 打开：

`https://sphinxl97.github.io/detail.html?id=001#places`

5. 按 `Ctrl + F5` 强制刷新。

页面右侧应显示“共享实时数据”，并出现测试意见。

## 7. 验证所有访问者共同累计

1. 普通浏览器打开网站。
2. 无痕窗口再打开同一页面。
3. 在普通窗口点“认同”。
4. 无痕窗口应在短时间内看到计数同步变化，无需手动刷新。
5. 同一浏览器再次点击相同按钮会取消投票；改点另一项会切换投票。

## 8. 日常审核

当前用户提交仍通过 Web3Forms 发到邮箱，不会自动写入 Supabase。

审核流程：

1. 邮箱查看新意见；
2. 认为可以公开时，在 `suggestions` 表新增一行；
3. `status` 先填 `pending` 进行整理；
4. 确认后改成 `approved`；
5. 主站会实时出现该意见。

公开表中不要写入用户邮箱。邮箱继续只保留在 Web3Forms 邮件中。
