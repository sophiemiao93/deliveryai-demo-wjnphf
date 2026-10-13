import { Accessibility, Crown, Languages, LayoutDashboard, MapPin, Moon, PhoneCall, ReceiptText, Search, Sun, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { tableAreas } from '@/data/menu'
import type { ViewName } from '@/types'

interface TopBarProps {
  table: string
  view: ViewName
  serviceCount: number
  language: string
  elderly: boolean
  darkMode: boolean
  darkAuto: boolean
  onToggleLanguage: () => void
  onToggleElderly: () => void
  onToggleDark: () => void
  onToggleDarkAuto: () => void
  onView: (view: ViewName) => void
  onService: () => void
  onConsole: () => void
}

export function TopBar({ table, view, serviceCount, language, elderly, darkMode, darkAuto, onToggleLanguage, onToggleElderly, onToggleDark, onToggleDarkAuto, onView, onService, onConsole }: TopBarProps) {
  const { t } = useTranslation()
  const areaKey = tableAreas[table]
  const tableLabel = areaKey ? `${table} · ${t(areaKey)}` : table

  return (
    <>
      <div className="bg-charcoal-900 px-4 py-2 text-center text-xs font-semibold tracking-wide text-rice-100">
        {t('common.banner')}
      </div>
      <header className="sticky top-0 z-30 border-b border-charcoal-900/5 bg-rice-50/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 lg:px-6">
          <button onClick={() => onView('menu')} className="flex items-center gap-2 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-chili-500 text-lg font-black text-white shadow-md">{t('common.brand')}</span>
            <span className="hidden sm:block"><strong className="block leading-4 text-charcoal-900">{t('common.brand_name')}</strong><small className="text-charcoal-500">{t('common.subtitle')}</small></span>
          </button>
          <span className="ml-1 flex items-center gap-1 rounded-full bg-rice-200 px-3 py-2 text-xs font-bold text-charcoal-700"><MapPin size={13} className="text-chili-500" />{tableLabel}</span>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            <Button variant={view === 'menu' ? 'secondary' : 'ghost'} size="sm" onClick={() => onView('menu')}><Search size={16} />{t('common.nav_menu')}</Button>
            <Button variant={view === 'order' ? 'secondary' : 'ghost'} size="sm" onClick={() => onView('order')}><ReceiptText size={16} />{t('common.nav_order')}</Button>
          </nav>
          <Button variant="outline" size="icon" onClick={onService} className="relative" aria-label={t('common.aria_service')}>
            <PhoneCall size={18} />{serviceCount > 0 && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-chili-500" />}
          </Button>
          <Dialog>
            <DialogTrigger asChild><Button variant="outline" size="icon" aria-label={t('common.aria_member')}><UserRound size={18} /></Button></DialogTrigger>
            <DialogContent title={t('common.member_title')}>
              <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-charcoal-900 to-charcoal-700 p-5 text-white shadow-card">
                <div className="flex items-start justify-between"><span className="rounded-xl bg-amber-400 p-2 text-charcoal-900"><Crown /></span><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{t('common.member_badge')}</span></div>
                <p className="mt-6 text-sm text-rice-200">{t('common.member_name')}</p><p className="mt-1 text-2xl font-bold">2,680 <small className="text-sm font-medium text-rice-200">{t('common.growth_value')}</small></p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-charcoal-500">{t('common.queue')}</p><p className="mt-2 text-2xl font-extrabold text-charcoal-900">A018</p><p className="text-xs text-chili-500">{t('common.queue_ahead')}</p></div>
                <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs text-charcoal-500">{t('common.benefits')}</p><p className="mt-2 text-2xl font-extrabold text-charcoal-900">4 <small className="text-sm">{t('common.tickets')}</small></p><p className="text-xs text-amber-500">{t('common.coupon')}</p></div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="icon" onClick={onConsole} aria-label={t('common.aria_console')}><LayoutDashboard size={18} /></Button>
          <Button variant="outline" size="icon" onClick={onToggleElderly} aria-label={elderly ? '切换至常规模式' : '切换至老人模式'}>
            <Accessibility size={18} className={elderly ? 'text-chili-500' : ''} />
          </Button>
          {/* 黑夜模式切换 */}
          <Button variant="outline" size="icon" onClick={onToggleDark} aria-label={darkMode ? t('common.aria_light') : t('common.aria_dark')}>
            {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </Button>
          {/* 系统跟随切换 */}
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleDarkAuto}
            aria-label={t('common.aria_auto_dark')}
            title={darkAuto ? t('common.dark_auto_on') : t('common.dark_auto_off')}
            className={darkAuto ? 'text-chili-500' : 'opacity-50'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </Button>
          <Button variant="outline" size="sm" onClick={onToggleLanguage} aria-label={t('common.aria_lang')}>
            <Languages size={16} />{language === 'zh' ? 'EN' : '中'}
          </Button>
        </div>
      </header>
    </>
  )
}
