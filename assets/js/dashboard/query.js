import React from 'react'
import { Link, withRouter } from 'react-router-dom'
import {formatDay, formatMonthYYYY, nowForSite, parseUTCDate} from './date'
import * as storage from './storage'

const PERIODS = ['realtime', 'day', 'month', '7d', '30d', '6mo', '12mo', 'custom']

export function parseQuery(querystring, site) {
  const q = new URLSearchParams(querystring)
  let period = q.get('period')
  const periodKey = `period__${  site.domain}`

  if (PERIODS.includes(period)) {
    if (period !== 'custom' && period !== 'realtime') storage.setItem(periodKey, period)
  } else if (storage.getItem(periodKey)) {
      period = storage.getItem(periodKey)
    } else {
      period = '30d'
    }

  return {
    period,
    date: q.get('date') ? parseUTCDate(q.get('date')) : nowForSite(site),
    from: q.get('from') ? parseUTCDate(q.get('from')) : undefined,
    to: q.get('to') ? parseUTCDate(q.get('to')) : undefined,
    filters: {
      'goal': q.get('goal'),
      'props': JSON.parse(q.get('props')),
      'source': q.get('source'),
      'utm_medium': q.get('utm_medium'),
      'utm_source': q.get('utm_source'),
      'utm_campaign': q.get('utm_campaign'),
      'referrer': q.get('referrer'),
      'screen': q.get('screen'),
      'browser': q.get('browser'),
      'browser_version': q.get('browser_version'),
      'os': q.get('os'),
      'os_version': q.get('os_version'),
      'country': q.get('country'),
      'page': q.get('page'),
      'entry_page': q.get('entry_page'),
      'exit_page': q.get('exit_page')
    }
  }
}

export function countFilters(query) {
  let count = 0;
  for (const filter of Object.values(query.filters)) {
    if (filter) count++;
  }

  return count;
}

function generateQueryString(data) {
  const query = new URLSearchParams(window.location.search)
  Object.keys(data).forEach(key => {
    if (!data[key]) {
      query.delete(key)
      return
    }

    query.set(key, data[key])
  })
  return query.toString()
}

export function navigateToQuery(history, queryFrom, newData) {
  // if we update any data that we store in localstorage, make sure going back in history will
  // revert them
  if (newData.period && newData.period !== queryFrom.period) {
    const replaceQuery = new URLSearchParams(window.location.search)
    replaceQuery.set('period', queryFrom.period)
    history.replace({ search: replaceQuery.toString() })
  }

  // then push the new query to the history
  history.push({ search: generateQueryString(newData) })
}

class QueryLink extends React.Component {
  constructor(props) {
    super(props)
    this.onClick = this.onClick.bind(this)
  }

  onClick(e) {
    e.preventDefault()
    navigateToQuery(this.props.history, this.props.query, this.props.to)
    if (this.props.onClick) this.props.onClick(e)
  }

  render() {
    const { history, query, to, ...props } = this.props
    return (
      <Link
        {...props}
        to={{ pathname: window.location.pathname, search: generateQueryString(to) }}
        onClick={this.onClick}
      />
)
  }
}
const QueryLinkWithRouter = withRouter(QueryLink)
export { QueryLinkWithRouter as QueryLink };

class QueryButton extends React.Component {
  render() {
    const { history, query, to, disabled, className, children } = this.props
    return (
      <button
        className={className}
        onClick={(event) => {
          event.preventDefault()
          navigateToQuery(history, query, to)
          if (this.props.onClick) this.props.onClick(event)
          history.push({ pathname: window.location.pathname, search: generateQueryString(to) })
        }}
        type="button"
        disabled={disabled}
      >
        {children}
      </button>
    )
  }
}
const QueryButtonWithRouter = withRouter(QueryButton)
export { QueryButtonWithRouter as QueryButton };

export function toHuman(query) {
  if (query.period === 'day') {
    return `on ${formatDay(query.date)}`
  } if (query.period === 'month') {
    return `in ${formatMonthYYYY(query.date)}`
  } if (query.period === '7d') {
    return 'in the last 7 days'
  } if (query.period === '30d') {
    return 'in the last 30 days'
  } if (query.period === '6mo') {
    return 'in the last 6 months'
  } if (query.period === '12mo') {
    return 'in the last 12 months'
  }
}

export function removeQueryParam(search, parameter) {
  const q = new URLSearchParams(search)
  q.delete(parameter)
  return q.toString()
}

export function eventName(query) {
  if (query.filters.goal) {
    if (query.filters.goal.startsWith('Visit ')) {
      return 'pageviews'
    }
    return 'events'
  }
  return 'pageviews'
}

export const formattedFilters = {
  'goal': 'Goal',
  'props': 'Goal properties',
  'source': 'Source',
  'utm_medium': 'UTM Medium',
  'utm_source': 'UTM Source',
  'utm_campaign': 'UTM Campaign',
  'referrer': 'Referrer URL',
  'screen': 'Screen size',
  'browser': 'Browser',
  'browser_version': 'Browser Version',
  'os': 'Operating System',
  'os_version': 'Operating System Version',
  'country': 'Country',
  'page': 'Page',
  'entry_page': 'Entry Page',
  'exit_page': 'Exit Page'
}
