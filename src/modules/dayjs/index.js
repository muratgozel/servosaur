import dayjs from 'dayjs'
import dayjsLocaleData from 'dayjs/plugin/localeData.js'
import dayjsAdvancedFormat from 'dayjs/plugin/advancedFormat.js'
import dayjsDayOfYear from 'dayjs/plugin/dayOfYear.js'
import dayjsDuration from 'dayjs/plugin/duration.js'
import dayjsIsBetween from 'dayjs/plugin/isBetween.js'
import dayjsLocalizedFormat from 'dayjs/plugin/localizedFormat.js'
import dayjsRelativeTime from 'dayjs/plugin/relativeTime.js'
import dayjsUTC from 'dayjs/plugin/utc.js'
import dayjsTimezone from 'dayjs/plugin/timezone.js'
import dayjsWeekOfYear from 'dayjs/plugin/weekOfYear.js'
import 'dayjs/locale/en.js'
import 'dayjs/locale/tr.js'

dayjs.extend(dayjsLocaleData)
dayjs.extend(dayjsAdvancedFormat)
dayjs.extend(dayjsDayOfYear)
dayjs.extend(dayjsDuration)
dayjs.extend(dayjsIsBetween)
dayjs.extend(dayjsLocalizedFormat)
dayjs.extend(dayjsRelativeTime)
dayjs.extend(dayjsUTC)
dayjs.extend(dayjsTimezone)
dayjs.extend(dayjsWeekOfYear)

dayjs.tz.setDefault('UTC')

export default dayjs
