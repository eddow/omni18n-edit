import type { Locale, MemDB } from 'omni18n/ts/s-a'

export interface DbContext {
	db: MemDB
	locales: Locale[]
}
