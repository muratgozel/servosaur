import EventEmitter from 'events'
import Bowser from 'bowser'
import {WebServiceClient as MaxmindClient} from '@maxmind/geoip2-node'
import localeutil from 'locale-util'

const {countryNamesByCode} = localeutil.extra

export default class Device extends EventEmitter {
  constructor(credentials={}) {
    super()

    this.maxmindAccountId = credentials.maxmindAccountId || ''
    this.maxmindLicenseKey = credentials.maxmindLicenseKey || ''

    this.ua = null
    this.ip = null
    this.emptyDevice = {
      location: {
        country: null,
        countryName: null,
        city: null,
        timezone: null,
        isp: null,
        pretty: 'Unknown location.'
      },
      browser: {},
      os: {},
      platform: {},
      engine: {},
      pretty: 'Unknown device.'
    }
    this.inspectedDevice = {}
    this.cache = {} // TODO use better in-memory cache. ip addresses change
  }

  async inspect(ua=null, ip=null) {
    this.inspectedDevice = {}
    this.ua = ua
    this.ip = ip

    if (this.ua) {
      const parsedua = this.parseUserAgent(this.ua)

      Object.keys(this.device).map(
        p => parsedua.hasOwnProperty(p) ? this.inspectedDevice[p] = parsedua[p] : null
      )
    }

    if (this.ip) {
      this.inspectedDevice.location = await this.geolocate(this.ip)
    }

    return this.inspectedDevice
  }

  parseUserAgent(ua) {
    const encoded = Buffer.from(ua).toString('base64')

    if (this.cache[encoded]) {
      return this.cache[encoded]
    }

    try {
      const result = {}
      const obj = Bowser.parse(ua)

      if (obj.browser) result.browser = obj.browser
      if (obj.engine) result.engine = obj.engine
      if (obj.os) result.os = obj.os
      if (obj.platform) result.platform = obj.platform

      result.pretty = this.prettyUserAgent(result)

      this.cache[encoded] = result

      return result
    } catch (e) {
      this.emit('error', e, 'Error while parsing user agent "' + ua + '".')
      return {}
    }
  }

  prettyUserAgent(obj) {
    return [
      obj.platform?.vendor || obj.os?.name || '',
      obj.browser?.name && obj.browser?.version ? `${obj.browser.name} ${obj.browser.version}` : '',
      obj.platform?.type ? obj.platform.type.toUpperCase() : ''
    ]
    .filter(item => item.length > 0)
    .join(', ')
  }

  async geolocate(ip) {
    if (this.cache[ip]) {
      return this.cache[ip]
    }

    if (!this.maxmindAccountId || !this.maxmindLicenseKey) {
      this.emit('error', new Error('Missing credentials for geolocate.'))
      return this.device.location
    }

    try {
      const geoip = new MaxmindClient(this.maxmindAccountId, this.maxmindLicenseKey)
      const queryResult = await geoip.city(ip)

      if (queryResult.error) {
        this.emit('error', queryResult.error, 'Error while geolocating ip ' + ip)
        return this.device.location
      }

      const {country, city, location, traits} = queryResult
      const result = {
        country: country.isoCode,
        countryName: countryNamesByCode[country.isoCode] || country.isoCode,
        city: city.names.en,
        timezone: location.timeZone,
        isp: traits.isp,
        pretty: this.prettyLocation(queryResult)
      }

      this.cache[ip] = result

      return result
    } catch (e) {
      this.emit('error', e, 'Error while geolocating ip ' + ip)
      return this.device.location
    }
  }

  prettyLocation(obj) {
    return [
      obj.city.names.en,
      countryNamesByCode[resp.country.isoCode] || resp.country.isoCode
    ]
    .filter(item => item.length > 0)
    .join(', ')
  }
}
