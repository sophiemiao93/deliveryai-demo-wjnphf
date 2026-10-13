import { test, expect, type Page } from '@playwright/test'

/** 从首页绑定 A08 桌台并进入点餐视图（menu），TopBar 中的黑夜模式按钮仅在此之后可见。 */
async function enterMenu(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /A08/ }).first().click()
  await page.getByRole('button', { name: /进入点餐|Enter/ }).click()
}

test.describe('黑夜模式（Dark Mode）- E2E 验收测试', () => {

  test('DARK-001: 手动切换白天/黑夜模式 — 按钮切换、class 切换、样式生效、localStorage 持久化', async ({ page }) => {
    // 清除 localStorage 中的 dark mode 设置，确保从浅色模式开始
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('dark-mode')
      localStorage.removeItem('dark-mode-auto')
    })
    await page.reload()
    await page.waitForLoadState('load')

    // 进入菜单页使 TopBar 渲染
    await page.getByRole('button', { name: /A08/ }).first().click()
    await page.getByRole('button', { name: /进入点餐|Enter/ }).click()
    await expect(page).toHaveURL(/#\/menu$/)

    // 验证初始为浅色模式：html 无 dark class
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    // 定位黑夜模式切换按钮（aria-label="切换黑夜模式"）
    const darkToggle = page.getByRole('button', { name: '切换黑夜模式' })
    await expect(darkToggle).toBeVisible()

    // === 操作：点击切换为黑夜模式 ===
    await darkToggle.click()

    // 验证 html 添加了 dark class
    await expect(page.locator('html')).toHaveClass(/dark/)

    // 验证按钮 aria-label 变为 "切换白天模式"
    await expect(page.getByRole('button', { name: '切换白天模式' })).toBeVisible()

    // 验证 localStorage 已持久化
    const lsDark = await page.evaluate(() => localStorage.getItem('dark-mode'))
    expect(lsDark).toBe('true')

    // 验证 html 元素背景色变为深色（CSS 变量在 :root/.dark 上）
    const htmlBg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
    expect(htmlBg).toBe('rgb(26, 26, 24)')

    // === 操作：切回白天模式 ===
    await page.getByRole('button', { name: '切换白天模式' }).click()

    // 验证 html 移除了 dark class
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    // 验证按钮 aria-label 恢复
    await expect(page.getByRole('button', { name: '切换黑夜模式' })).toBeVisible()

    // 验证 localStorage 更新
    const lsLight = await page.evaluate(() => localStorage.getItem('dark-mode'))
    expect(lsLight).toBe('false')

    // === 验证刷新后持久化保持 ===
    await page.reload()
    await page.waitForLoadState('load')
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('DARK-002: 跟随系统主题开关 — 手动切换关闭 auto、图标状态变化、localStorage 持久化', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('dark-mode')
      localStorage.removeItem('dark-mode-auto')
    })
    await page.reload()
    await page.waitForLoadState('load')

    // 进入菜单页使 TopBar 渲染
    await page.getByRole('button', { name: /A08/ }).first().click()
    await page.getByRole('button', { name: /进入点餐|Enter/ }).click()
    await expect(page).toHaveURL(/#\/menu$/)

    // auto 按钮可见
    const autoBtn = page.getByRole('button', { name: '跟随系统主题' })
    await expect(autoBtn).toBeVisible()

    // === 操作：手动切换黑夜模式 → auto 应自动关闭 ===
    const darkToggle = page.getByRole('button', { name: '切换黑夜模式' })
    await darkToggle.click()

    // 验证 auto 按钮变为半透明（opacity-50），表示 auto 已关闭
    const classAfterToggle = await autoBtn.getAttribute('class')
    expect(classAfterToggle?.split(/\s+/)).toContain('opacity-50')
    await expect(page.locator('html')).toHaveClass(/dark/)

    // 验证 auto localStorage 更新为 false
    const autoVal = await page.evaluate(() => localStorage.getItem('dark-mode-auto'))
    expect(autoVal).toBe('false')
    const darkVal = await page.evaluate(() => localStorage.getItem('dark-mode'))
    expect(darkVal).toBe('true')

    // === 操作：重新开启 auto 跟随 ===
    await autoBtn.click()

    // auto 开启状态下，auto 按钮不应有独立的 opacity-50
    const classAfterAuto = await autoBtn.getAttribute('class')
    expect(classAfterAuto?.split(/\s+/)).not.toContain('opacity-50')

    // auto 开启后，dark-mode 应被移除（由系统主题决定）
    const autoVal2 = await page.evaluate(() => localStorage.getItem('dark-mode-auto'))
    expect(autoVal2).toBe('true')
    const darkVal2 = await page.evaluate(() => localStorage.getItem('dark-mode'))
    expect(darkVal2).toBeNull()

    // === 验证刷新后 auto 状态持久化 ===
    await page.reload()
    await page.waitForLoadState('load')
    const autoAfterReload = await page.evaluate(() => localStorage.getItem('dark-mode-auto'))
    expect(autoAfterReload).toBe('true')
  })

  test('DARK-003: 黑夜模式下跨视图浏览 — 所有页面一致应用深色主题', async ({ page }) => {
    // 确保从干净的 localStorage 开始
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('dark-mode')
      localStorage.removeItem('dark-mode-auto')
      // 设置手动 dark mode，刷新后 FOUC 会应用
      localStorage.setItem('dark-mode', 'true')
      localStorage.setItem('dark-mode-auto', 'false')
    })
    // FOUC 内联脚本会同步恢复 dark class（dark-mode-auto=false + dark-mode=true）
    await page.reload()
    await page.waitForLoadState('load')

    // 验证 dark class 已由 FOUC 脚本激活
    await expect(page.locator('html')).toHaveClass(/dark/)

    // 进入菜单页
    await page.getByRole('button', { name: /A08/ }).first().click()
    await page.getByRole('button', { name: /进入点餐|Enter/ }).click()
    await expect(page).toHaveURL(/#\/menu$/)

    // dark class 持续存在
    await expect(page.locator('html')).toHaveClass(/dark/)

    // 验证 CSS 变量在 dark 模式下已切换（用 property value 而非 computed color）
    const chiliVar = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-chili-500').trim()
    })
    expect(chiliVar).toBe('232 106 90')

    // 验证核心文案可读
    await expect(page.getByRole('heading', { name: '鎏金番茄鸳鸯锅' })).toBeVisible()

    // === 进入订单页（OrderView）===
    await page.getByRole('button', { name: /订单|Orders/ }).first().click()
    await expect(page).toHaveURL(/#\/order$/)
    await expect(page.locator('html')).toHaveClass(/dark/)

    // 验证订单页空态文案可见
    await expect(page.getByText('还没有已提交订单').or(page.getByText('No orders submitted yet')).first()).toBeVisible()

    // === 返回菜单页 ===
    await page.getByRole('button', { name: /点餐|Menu/ }).first().click()
    await expect(page).toHaveURL(/#\/menu$/)
    await expect(page.locator('html')).toHaveClass(/dark/)

    // 验证 TopBar 存在
    const header = page.locator('header').first()
    await expect(header).toBeVisible()
  })
})
