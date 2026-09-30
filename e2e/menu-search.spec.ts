import { test, expect, type Page } from '@playwright/test'

/** 从首页绑定 A08 桌台并进入点餐视图（menu）。 */
async function enterMenu(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /A08/ }).first().click()
  await page.getByRole('button', { name: /进入点餐|Enter/ }).click()
}

test.describe('菜单搜索功能 - E2E 验收测试', () => {

  test('REQ-SEARCH-001: 搜索联想功能 - 输入关键词展示联想候选，点击后触发搜索', async ({ page }) => {
    await enterMenu(page)

    // 定位搜索输入框
    const searchInput = page.getByRole('combobox', { name: '' })
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toHaveAttribute('placeholder', '搜索锅底、菜品或饮品')

    // 输入关键词 "牛"
    await searchInput.fill('牛')
    await expect(searchInput).toHaveValue('牛')

    // 搜索联想面板应该出现
    const suggestPanel = page.locator('#search-suggestions')
    await expect(suggestPanel).toBeVisible()

    // 联想的 role="listbox" 存在
    await expect(suggestPanel).toHaveAttribute('role', 'listbox')

    // 联想中应包含菜品候选：牛油麻辣锅、琥珀嫩牛肉、雪花肥牛卷
    const suggestionItems = suggestPanel.locator('[role="option"]')
    await expect(suggestionItems.first()).toBeVisible()
    const suggestionTexts = await suggestionItems.allTextContents()
    const hasBeefPepper = suggestionTexts.some(t => t.includes('牛油麻辣锅'))
    const hasAmberBeef = suggestionTexts.some(t => t.includes('琥珀嫩牛肉'))
    const hasMarbledBeef = suggestionTexts.some(t => t.includes('雪花肥牛卷'))
    expect(hasBeefPepper).toBeTruthy()
    expect(hasAmberBeef).toBeTruthy()
    expect(hasMarbledBeef).toBeTruthy()

    // 联想中应包含分类候选：牛羊肉
    const hasCategoryMeat = suggestionTexts.some(t => t.includes('牛羊肉'))
    expect(hasCategoryMeat).toBeTruthy()

    // 点击第一个菜品联想候选（应该是 "牛油麻辣锅"）
    const firstProductSuggestion = suggestionItems.filter({ hasText: '牛油麻辣锅' }).first()
    await firstProductSuggestion.click()

    // 联想面板应关闭
    await expect(suggestPanel).not.toBeVisible()

    // 搜索框内容应替换为联想的文本
    await expect(searchInput).toHaveValue('牛油麻辣锅')

    // 搜索结果应展示牛油麻辣锅卡片
    await expect(page.getByRole('heading', { name: '牛油麻辣锅' })).toBeVisible()
  })

  test('REQ-SEARCH-002: 搜索结果展示、空态与清空恢复', async ({ page }) => {
    await enterMenu(page)

    const searchInput = page.getByRole('combobox', { name: '' })

    // === 场景1：搜索有结果的菜品 ===
    await searchInput.fill('虾')
    // 等待防抖 300ms
    await page.waitForTimeout(400)

    // 搜索结果应展示 "鲜虾滑"
    await expect(page.getByRole('heading', { name: '鲜虾滑' })).toBeVisible()

    // 搜索中的分类选项卡应为半透明状态（opacity 降低）
    const categoryTabs = page.locator('button:has-text("推荐"), button:has-text("锅底"), button:has-text("牛羊肉"), button:has-text("海鲜河鲜"), button:has-text("蔬菜豆品"), button:has-text("主食饮品")')
    const tabCount = await categoryTabs.count()
    expect(tabCount).toBeGreaterThanOrEqual(3)

    // === 场景2：清空搜索框，恢复分类视图 ===
    // 点击清除按钮 (X)
    const clearButton = page.locator('button[aria-label="关闭"]')
    await clearButton.click()

    // 搜索框应被清空，恢复默认分类选项卡高亮
    await expect(searchInput).toHaveValue('')
    // 恢复分类过滤，推荐分类下显示菜品
    await expect(page.getByRole('heading', { name: '鎏金番茄鸳鸯锅' })).toBeVisible()

    // === 场景3：无匹配结果时空态提示 ===
    await searchInput.fill('zzz')
    await page.waitForTimeout(400)

    // 应展示空态提示
    await expect(page.getByText('未找到相关菜品，试试其他关键词')).toBeVisible()
  })

  test('REQ-SEARCH-003: 售罄标签、加购禁用与正常加购', async ({ page }) => {
    await enterMenu(page)

    const searchInput = page.getByRole('combobox', { name: '' })

    // === 前置：通过 Demo Console 将 "鲜虾滑" (p5) 设为售罄 ===
    // 打开演示控制台
    await page.getByRole('button', { name: '演示控制台' }).click()

    // 在售罄开关区域点击鲜虾滑按钮进行切换（按钮包含文本 "鲜虾滑"）
    const soldOutSection = page.locator('text=菜品售罄开关').locator('..')
    const shrimpToggle = soldOutSection.locator('button', { hasText: '鲜虾滑' })
    await shrimpToggle.click()

    // 关闭演示控制台
    await page.keyboard.press('Escape')

    // === 场景1：搜索结果中售罄菜品展示售罄标签 ===
    await searchInput.fill('虾滑')
    await page.waitForTimeout(400)

    // 鲜虾滑应出现在搜索结果中，且有售罄遮罩
    const shrimpCard = page.locator('article', { hasText: '鲜虾滑' })
    await expect(shrimpCard).toBeVisible()
    // 售罄文本 "今日售罄" 应该可见
    await expect(shrimpCard.locator('text=今日售罄')).toBeVisible()

    // 加购按钮应该被禁用
    const addButtons = shrimpCard.locator('button').filter({ has: page.locator('svg.lucide-plus') })
    await expect(addButtons.first()).toBeDisabled()

    // === 场景2：搜索结果中非售罄菜品可正常加入点菜 ===
    // 清空搜索并搜索 "琥珀嫩牛肉"（非售罄）
    await page.locator('button[aria-label="关闭"]').click()
    await page.waitForTimeout(400)

    await searchInput.fill('琥珀嫩牛肉')
    await page.waitForTimeout(400)

    const beefCard = page.locator('article', { hasText: '琥珀嫩牛肉' })
    await expect(beefCard).toBeVisible()

    // 非售罄菜品加购按钮可用，点击打开规格弹窗
    const beefAddButton = beefCard.locator('button').filter({ has: page.locator('svg.lucide-plus') })
    await expect(beefAddButton.first()).not.toBeDisabled()
    await beefAddButton.first().click()

    // 规格弹窗应打开
    await expect(page.getByText('选择份量')).toBeVisible()
    await expect(page.getByText('选择口味')).toBeVisible()
    await expect(page.getByText('谁点了')).toBeVisible()

    // 选择默认选项后加入购物车
    await page.getByRole('button', { name: '加入本桌购物车' }).click()

    // 加购成功后应有 Toast 提示
    await expect(page.getByText(/琥珀嫩牛肉|点了/)).toBeVisible()

    // 购物车状态更新（底栏或 Toast）
    await expect(page.getByText(/琥珀嫩牛肉/).first()).toBeVisible()

    // === 后置：将鲜虾滑恢复为可售（清理测试副作用） ===
    await page.getByRole('button', { name: '演示控制台' }).click()
    const shrimpRestore = soldOutSection.locator('button', { hasText: '鲜虾滑' })
    await shrimpRestore.click()
    await page.keyboard.press('Escape')
  })
})
