import crypto from 'crypto'
import dayjs from './modules/dayjs/index.js'

export const generateUuid = () => {
  return crypto.randomUUID()
}

export const getSystemTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export const getCurrentDate = () => {
  return dayjs().tz('UTC').format('YYYY-MM-DDTHH:mm:ss.SSSZ')
}