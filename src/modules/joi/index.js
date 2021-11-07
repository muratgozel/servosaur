import localeutil from 'locale-util'
import Joi from 'joi'

const {countryCodes, currencyCodes, localeList} = localeutil.extra
const {timezones} = localeutil.core
const localeListArr = Object.keys(localeList)

function phone(joi) {
  return {
    type: 'phone',
    base: joi.object(),
    messages: {
      missingProp: '{{#label}} must have {{#prop}} property.',
      invalid: '{{#label}} is invalid.'
    },
    validate(value, helpers) {
      if (!value.hasOwnProperty('num')) {
        return {value, errors: helpers.error('missingProp', {prop: 'num'})}
      }

      if (!value.hasOwnProperty('country')) {
        return {value, errors: helpers.error('missingProp', {prop: 'country'})}
      }
/*
      const valid = isValidPhoneNumber(value.num, value.country)

      if (!valid) {
        return {value, errors: helpers.error('invalid')}
      }

      let obj=null
      try {
        obj = parsePhoneNumberWithError(value.num, value.country)
      } catch (e) {
        return {value, errors: helpers.error('invalid')}
      }
*/
      return {value: {
        num: value.number,
        country: value.country
      }}
    }
  }
}

function countryCode(joi) {
  return {
    type: 'countryCode',
    base: joi.string(),
    messages: {
      invalid: '{{#label}} is invalid.'
    },
    validate(value, helpers) {
      if (countryCodes.indexOf(value.toUpperCase()) === -1) {
        return {value, errors: helpers.error('invalid')}
      }

      return {value: value.toUpperCase()}
    }
  }
}

function currency(joi) {
  return {
    type: 'currency',
    base: joi.string(),
    messages: {
      invalid: '{{#label}} is invalid.'
    },
    validate(value, helpers) {
      if (currencyCodes.indexOf(value.toUpperCase()) === -1) {
        return {value, errors: helpers.error('invalid')}
      }

      return {value: value.toUpperCase()}
    }
  }
}

function locale(joi) {
  return {
    type: 'locale',
    base: joi.string(),
    messages: {
      invalid: '{{#label}} is invalid.'
    },
    validate(value, helpers) {
      if (value.indexOf('-') === -1 && value.indexOf('_') === -1) {
        return {value, errors: helpers.error('invalid')}
      }

      const [language, country] = value.split(/[-_]/)
      const formatted = language.toLowerCase() + '_' + country.toUpperCase()

      if (localeListArr.indexOf(formatted) === -1) {
        return {value, errors: helpers.error('invalid')}
      }

      return {value: formatted}
    }
  }
}

function timezone(joi) {
  return {
    type: 'timezone',
    base: joi.string(),
    messages: {
      invalid: '{{#label}} is invalid.'
    },
    validate(value, helpers) {
      const matches = timezones.filter(t => t.id == value)

      if (!matches) {
        return {value, errors: helpers.error('invalid')}
      }

      return {value: value}
    }
  }
}

let joi = Joi.extend(phone)

joi = joi.extend(countryCode)
joi = joi.extend(currency)
joi = joi.extend(locale)
joi = joi.extend(timezone)

export default joi
