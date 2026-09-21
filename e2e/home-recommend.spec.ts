import { test, expect } from '@playwright/test'

test.describe('首页推荐菜模块 - E2E 验收测试', () => {
  test('REQ-001 & REQ-002: 首页首屏推荐菜区域可见，展示标题和最多4张含名称/价格/badge的推荐菜卡片', async ({ page }) => {
    await page.goto('/')

    // 推荐菜区域标题可见
    await expect(page.getByRole('heading', { name: '今日推荐' })).toBeVisible()

    // 推荐菜区域在首屏可见（无需滚动，元素在视口内）
    const recommendSection = page.locator('section', { hasText: '今日推荐' }).first()
    await expect(recommendSection).toBeVisible()
    const box = await recommendSection.boundingBox()
    expect(box).not.toBeNull()
    // 在默认 1280x720 视口下，推荐菜区域顶部应在视口内
    expect(box!.y).toBeLessThan(720)

    // 展示 4 张推荐菜卡片（带 badge 的菜品：p1/p2/p3/p5）
    const recommendCards = recommendSection.locator('button:has(h3)')
    await expect(recommendCards).toHaveCount(4)

    // 每张卡片包含菜品名称、价格和 badge 标签
    const expectedNames = ['鎏金番茄鸳鸯锅', '牛油麻辣锅', '琥珀嫩牛肉', '鲜虾滑']
    const expectedPrices = ['¥68.00', '¥59.00', '¥42.00', '¥39.00']
    const expectedBadges = ['人气 No.1', '招牌', '主厨推荐', '新品']

    for (let i = 0; i < 4; i++) {
      const card = recommendCards.nth(i)
      await expect(card.locator('h3')).toHaveText(expectedNames[i])
      await expect(card.locator('p')).toHaveText(expectedPrices[i])
      await expect(card.locator('span.bg-amber-400')).toHaveText(expectedBadges[i])
    }
  })

  test('REQ-003: 点击推荐菜卡片自动绑桌 A08 并跳转到欢迎页', async ({ page }) => {
    await page.goto('/')

    // 定位第一张推荐菜卡片
    const recommendSection = page.locator('section', { hasText: '今日推荐' }).first()
    const firstCard = recommendSection.locator('button:has(h3)').first()
    await expect(firstCard).toBeVisible()

    // 点击推荐菜卡片
    await firstCard.click()

    // 自动绑桌 A08 并跳转到欢迎页（URL hash 变为 #/welcome）
    await expect(page).toHaveURL(/#\/welcome$/)
    await expect(page.getByRole('button', { name: /进入点餐|Enter/ })).toBeVisible()
  })

  test('NFR-005: 首页现有绑桌卡片功能不受推荐菜影响', async ({ page }) => {
    await page.goto('/')

    // 绑桌卡片区域仍在
    await expect(page.getByRole('button', { name: '快速进入 A08 桌' })).toBeVisible()

    // 点击桌台选项 A08 仍可绑桌并进入欢迎页
    await page.getByRole('button', { name: /A08/ }).first().click()
    await expect(page).toHaveURL(/#\/welcome$/)
    await expect(page.getByRole('button', { name: /进入点餐|Enter/ })).toBeVisible()
  })
})
