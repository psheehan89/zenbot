module.exports = function container (get, set, clear) {
  return function srsi (s, key, rsi_periods, srsi_periods, k, d) {
    get('lib.rsi')(s, 'rsi', rsi_periods)

    // Declare global variables
    var rangeRSI = []
    var rangeSRSI = []
    var rangeSRSIK = []
    var rangeSRSID = []
    // ---------------- RSI -> sRSI --------------- //
    // Store rsi_periods worth of historic period.rsi
    // into the array rangeSRSI
    if (typeof s.period.rsi !== 'undefined') {
      s.lookback.slice( 0, rsi_periods).forEach((period) => {
        if (period.rsi) rangeRSI.push(period.rsi)
      })
      // Find the Max and Min of array rangeSRSI
      let highestRSI = Math.max(...rangeRSI)
      let lowestRSI = Math.min(...rangeRSI)
      // Set RSIsum to the sum of array rangeRSI
      let RSIsum = rangeRSI.reduce((a,b) => { return a + b }, 0)
      // get average RSI for srsi_rsi_periods
      let aRSI = RSIsum / rsi_periods
      // Set stochRSI as % of average RSI over rsi_periods
      let sRSI = 100 * (( aRSI - lowestRSI ) / ( highestRSI - lowestRSI ))
      s.period.sRSI = sRSI
    }
    // ---------------- sRSI -> %K --------------- //
    // Store k periods of sRSI in array rangeSRSI
    if (typeof s.period.sRSI !== 'undefined') {
      s.lookback.slice(0, srsi_periods).forEach((period) => {
        if (period.sRSI) rangeSRSI.push(period.sRSI)
      })
      // Find Max and Min of array rangeSRSI
      let highestsRSI = Math.max(...rangeSRSI)
      let lowestsRSI = Math.min(...rangeSRSI)
      // Set SRSIsum as sum of array rangeSRSI
      let SRSIsum = rangeSRSI.reduce((a, b) => { return a + b }, 0)

      // Set aSRSI as average of SRSIsum over srsi_periods
      let aSRSI = SRSIsum / srsi_periods
      // Set sRSIk as % of aSRSI over srsi_periods
      let sRSIk = 100 * (( aSRSI - lowestsRSI ) / ( highestsRSI - lowestsRSI ))
      s.period.sRSIk = sRSIk
    }
    // ---------------- %K Smoothing --------------- //
    // Store k periods of period.sRSIk in array rangeSRSIK
    if (typeof s.period.sRSIk !== 'undefined') {
      s.lookback.slice(0, k).forEach((period) => {
        if (period.sRSIk) rangeSRSIK.push(period.sRSIk)
      })
      // Set SRSIKsum as sum of array rangeSRSIK
      let SRSIKsum = rangeSRSIK.reduce((a, b) => { return a + b }, 0)
      // Set sK as average of SRSIKsum over k
      var sK = SRSIKsum / k
      s.period.sK = sK
    }
    // ---------------- %D Smoothing --------------- //
    // Store d periods of period.sK in array rangeSRSID
    if (typeof s.period.sK !== 'undefined') {
      s.lookback.slice(0, d).forEach((period) => {
        if (period.sK) rangeSRSID.push(period.sK)
      })
      let SRSIDsum = rangeSRSID.reduce((a, b) => { return a + b }, 0)
      var sD = SRSIDsum / d
    }
    s.period[key + '_K'] = sK
    s.period[key + '_D'] = sD
  }
}
