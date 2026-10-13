import { test, expect, type Page } from '@playwright/test'

/** 从首页绑定 A08 桌台并进入点餐视图（menu），使 TopBar 渲染。 */
async function enterMenu(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /A08/ }).first().click()
  await page.getByRole('button', { name: /进入点餐|Enter/ }).click()
  await expect(page).toHaveURL(/#\/menu$/)
}

test.describe('老人模式（Elderly Mode）— E2E 验收测试', () => {

  test('ELDER-001: 一键开启/关闭老人模式 — html.elderly class、toast 提示、aria-label、localStorage 持久化', async ({ page }) => {
    // 清除 localStorage 中的老人模式设置，确保从普通模式开始
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('elderly-mode'))
    await page.reload()
    await page.waitForLoadState('load')

    // 进入菜单页使 TopBar 渲染
    await enterMenu(page)

    // 验证初始为普通模式：html 无 elderly class
    await expect(page.locator('html')).not.toHaveClass(/elderly/)

    // 定位老人模式切换按钮（aria-label="切换至老人模式"）
    const elderToggle = page.getByRole('button', { name: '切换至老人模式' })
    await expect(elderToggle).toBeVisible()

    // === 操作：点击切换为老人模式 ===
    await elderToggle.click()

    // 等待 CSS 过渡完成（全局 250ms transition + 余量）
    await page.waitForTimeout(400)

    // 验证 html 添加了 elderly class
    await expect(page.locator('html')).toHaveClass(/elderly/)

    // 验证按钮 aria-label 变为 "切换至常规模式"
    await expect(page.getByRole('button', { name: '切换至常规模式' })).toBeVisible()

    // 验证 toast 提示 "已切换为老人模式"
    await expect(page.getByText('已切换为老人模式')).toBeVisible()

    // 验证 localStorage 已持久化
    const lsElder = await page.evaluate(() => localStorage.getItem('elderly-mode'))
    expect(lsElder).toBe('true')

    // === 操作：切回普通模式 ===
    await page.getByRole('button', { name: '切换至常规模式' }).click()
    await page.waitForTimeout(400)

    // 验证 html 移除了 elderly class
    await expect(page.locator('html')).not.toHaveClass(/elderly/)

    // 验证按钮 aria-label 恢复
    await expect(page.getByRole('button', { name: '切换至老人模式' })).toBeVisible()

    // 验证 toast 提示 "已切换为常规模式"
    await expect(page.getByText('已切换为常规模式')).toBeVisible()

    // 验证 localStorage 更新
    const lsNormal = await page.evaluate(() => localStorage.getItem('elderly-mode'))
    expect(lsNormal).toBe('false')
  })

  test('ELDER-002: 老人模式视觉适配 — 150% 大字体、隐藏非核心元素、辅助提示可见', async ({ page }) => {
    // 清除 localStorage 并设置老人模式开启
    await page.goto('/')
    await page.evaluate(() => localStorage.setItem('elderly-mode', 'true'))
    await page.reload()
    await page.waitForLoadState('load')

    // 验证 elderly class 已应用
    await expect(page.locator('html')).toHaveClass(/elderly/)

    // 验证全局字号放大至 150%
    const fontSize = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)
    expect(fontSize).toBe('24px') // 16px * 150% = 24px

    // 进入菜单页
    await enterMenu(page)

    // 验证 elderly class 持续存在
    await expect(page.locator('html')).toHaveClass(/elderly/)

    // === REQ-004: 隐藏非核心干扰元素 ===
    // 验证 DemoConsole 入口（aria-label 含 aria_console）不可见
    await expect(page.getByRole('button', { name: /DemoConsole|演示控制台/ })).toHaveCount(0)

    // 验证会员卡弹窗入口不可见 — 通过 aria-label 定位
    const memberBtn = page.getByRole('button', { name: /会员信息|Member/ })
    await expect(memberBtn).toHaveCount(0)

    // 验证老人模式切换按钮仍可见
    await expect(page.getByRole('button', { name: '切换至常规模式' })).toBeVisible()

    // === REQ-005: 辅助提示可见 ===
    // 验证点餐页辅助提示文案可见
    const assistHint = page.getByText('点击菜品卡片选择规格并加入购物车')
    await expect(assistHint).toBeVisible()

    // === REQ-002: 按钮最小高度 ≥ 2.8rem ===
    // 检查老人模式切换按钮的最小高度
    const elderToggle = page.getByRole('button', { name: '切换至常规模式' })
    const toggleMinHeight = await elderToggle.evaluate((el) => getComputedStyle(el).minHeight)
    expect(parseFloat(toggleMinHeight)).toBeGreaterThanOrEqual(2.8 * 16) // 2.8rem → 44.8px

    // === 切回普通模式后辅助提示消失 ===
    await page.getByRole('button', { name: '切换至常规模式' }).click()
    await page.waitForTimeout(400)

    await expect(page.locator('html')).not.toHaveClass(/elderly/)

    // 辅助提示隐藏
    await expect(page.getByText('点击菜品卡片选择规格并加入购物车')).not.toBeVisible()

    // 普通模式下 DemoConsole 入口恢复可见
    await expect(page.getByRole('button', { name: /DemoConsole|演示控制台/ })).toBeVisible()
  })

  test('ELDER-003: 老人模式核心流程可用且模式切换不丢失数据', async ({ page }) => {
    // 清除 localStorage 从普通模式开始
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('elderly-mode'))
    await page.reload()
    await page.waitForLoadState('load')

    // 进入菜单页
    await enterMenu(page)

    // 普通模式下加购一个菜品：选择锅底分类
    await page.getByRole('button', { name: '锅底' }).click()
    // 打开第一个锅底商品规格弹窗
    await page.locator('article').nth(0).locator('button').last().click()
    // 选择重辣（不触发超级辣弹窗）
    await page.getByRole('button', { name: '重辣' }).click()
    await page.getByRole('button', { name: '加入本桌购物车' }).click()

    // 验证购物车出现商品
    await expect(page.getByText('本桌购物车').first()).toBeVisible()
    await expect(page.getByText('重辣').first()).toBeVisible()

    // === 开启老人模式 ===
    await page.getByRole('button', { name: '切换至老人模式' }).click()
    await page.waitForTimeout(400)

    // 验证 elderly class 已应用
    await expect(page.locator('html')).toHaveClass(/elderly/)

    // 验证购物车数据不丢失 — 重辣商品仍在
    await expect(page.getByText('本桌购物车').first()).toBeVisible()
    await expect(page.getByText('重辣').first()).toBeVisible()

    // === 切回普通模式 ===
    await page.getByRole('button', { name: '切换至常规模式' }).click()
    await page.waitForTimeout(400)

    await expect(page.locator('html')).not.toHaveClass(/elderly/)

    // 验证购物车数据仍不丢失
    await expect(page.getByText('本桌购物车').first()).toBeVisible()
    await expect(page.getByText('重辣').first()).toBeVisible()

    // === 在老人模式下继续核心操作 ===
    await page.getByRole('button', { name: '切换至老人模式' }).click()
    await page.waitForTimeout(400)
    await expect(page.locator('html')).toHaveClass(/elderly/)

    // 老人模式下点击菜品卡片可打开规格弹窗
    await page.getByRole('button', { name: '锅底' }).click()
    await page.locator('article').nth(1).locator('button').last().click()
    await expect(page.getByRole('heading', { name: '牛油麻辣锅' })).toBeVisible()
    await page.getByRole('button', { name: '中辣' }).click()
    await page.getByRole('button', { name: '加入本桌购物车' }).click()

    // 验证两个商品均在购物车
    await expect(page.getByText('重辣').first()).toBeVisible()
    await expect(page.getByText('中辣').first()).toBeVisible()
  })
})
