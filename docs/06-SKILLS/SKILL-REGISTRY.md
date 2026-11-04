# SKILL 注册与评估

> 指令 PART 6.4/14:研究外部 UI Skill 须先过六项验证(来源可信/开源/许可/适配 Vue/规则冲突/实际增益)。

## 已评估

| Skill | 来源 | 结论 |
| --- | --- | --- |
| AUTOVERSE 体系(治理方法) | github.com/jxzlhy/AUTOVERSE-TECH-LAB | ✅ 借鉴方法不照搬:证据分级 V/R/O/U、依赖登记、禁令结构 |
| Anthropic Frontend Design | 官方文档 | 📜 理念一致(层级/留白/reduced-motion),已吸收进设计哲学,无需安装 |
| Vercel Web Interface Guidelines | 官方 | 📜 键盘可达性/焦点样式已实现(:focus-visible 全局),其余列入检查清单 |

## 未引入的原因

- 未发现「不安装则缺失」的关键能力;本仓已建立 tokens 单一来源 + 基元组件,外部皮肤类 Skill 与 Design System 治理冲突(禁令 3)。
- 收集 Skill 不产生价值(PART 6.4 反面清单)。

## 未来触发条件

- 需要复杂组件行为(headless 逻辑)时评估 Reka UI(仅逻辑层)。
- 动效规范化遇到瓶颈时评估 Emil Kowalski 动效实践文章(非代码)。
