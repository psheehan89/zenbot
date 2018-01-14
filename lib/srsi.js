module.exports = function container (get, set, clear) {
  return function srsi (s, key, rsi_length, k, d) {
    get('lib.rsi')(s, 'rsi', rsi_length)
    let RSI = []
    let rangeKsum = 0
    let rangeDsum = 0
    if (s.period.rsi) {
      s.lookback.slice(0, rsi_length - 1).forEach(period => {
        if (period.rsi) RSI.push(period.rsi)
      })
    }

    RSI.push(s.period.rsi)
    let highestRSI = Math.max(...RSI)
    let lowestRSI = Math.min(...RSI)
    let stochRSI = ((s.period.rsi - lowestRSI) / (highestRSI - lowestRSI))
    s.period.stochRSI = stochRSI

    s.lookback.slice(0, k - 1).forEach(period => {
      if (period.stochRSI) rangeKsum += period.stochRSI
    })
    rangeKsum += stochRSI

    let stochK = 100 * (rangeKsum / k)

    s.lookback.slice(0, d - 1).forEach(period => {
      if (period.srsi_K) rangeDsum += period.srsi_K
    })
    rangeDsum += stochK
    let stochD = rangeDsum / d
    s.period[key + '_K'] = stochK
    s.period[key + '_D'] = stochD
    //console.log(s.lookback[0])
  }
}
