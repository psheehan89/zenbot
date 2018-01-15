let z = require('zero-fill')
  , n = require('numbro')

module.exports = function container (get, set, clear) {
  return {
    name: 'test',
    description: 'Stochastic MACD Strategy',

    getOptions: function () {
      this.option('period', 'period length, same as --period_length', String, '30m')
      this.option('period_length', 'period length, same as --period', String, '30m')
      this.option('min_periods', 'min. number of history periods', Number, 200)
      this.option('rsi_periods', 'number of RSI periods', 14)
      this.option('srsi_periods', 'number of RSI periods', Number, 9)
      this.option('srsi_k', '%K line', Number, 5)
      this.option('srsi_d', '%D line', Number, 3)
      this.option('oversold_rsi', 'buy when RSI reaches or drops below this value', Number, 10)
      this.option('overbought_rsi', 'sell when RSI reaches or goes above this value', Number, 90)
      this.option('ema_short_period', 'number of periods for the shorter EMA', Number, 21)
      this.option('ema_long_period', 'number of periods for the longer EMA', Number, 200)
      this.option('signal_period', 'number of periods for the signal EMA', Number, 9)
      this.option('up_trend_threshold', 'threshold to trigger a buy signal', Number, 0)
      this.option('down_trend_threshold', 'threshold to trigger a sold signal', Number, 0)
    },

    calculate: function (s) {
		// compute Stochastic RSI
		get('lib.srsi_edit')(s, 'srsi', s.options.rsi_periods, s.options.srsi_periods, s.options.srsi_k, s.options.srsi_d)

        // compute MACD
        get('lib.ema')(s, 'ema_short', s.options.ema_short_period)
        get('lib.ema')(s, 'ema_long', s.options.ema_long_period)
        if (s.period.ema_short && s.period.ema_long) {
          s.period.macd = (s.period.ema_short - s.period.ema_long)
          get('lib.ema')(s, 'signal', s.options.signal_period, 'macd')
          if (s.period.signal) {
            s.period.macd_histogram = s.period.macd - s.period.signal
          }
        }
    },

    onPeriod: function (s, cb) {
      let macd_over_uptrend_threshold = s.period.macd_histogram >= s.options.up_trend_threshold
      let macd_under_downtrend_threshold = s.period.macd_histogram < s.options.down_trend_threshold
      let k_line_over_d_line = s.period.srsi_K > s.period.srsi_D
      let rsi_under_oversold = s.period.rsi < s.options.oversold_rsi
      let rsi_over_overbought = s.period.rsi > s.options.overbought_rsi
      let k_line_trending_up

      s.lookback[0] ? k_line_trending_up = s.period.srsi_K > s.lookback[0].srsi_K : false

      if (!s.in_preroll) {
        if (typeof s.period.macd_histogram === 'number' && typeof s.lookback[0].macd_histogram === 'number' && typeof s.period.srsi_K === 'number' && typeof s.period.srsi_D === 'number') {
          // Buy signal
          if (macd_over_uptrend_threshold && ((k_line_over_d_line && k_line_trending_up) || rsi_under_oversold)) s.signal = 'buy'

          // Sell signal
          if (macd_under_downtrend_threshold && ((!k_line_over_d_line && !k_line_trending_up) || rsi_over_overbought)) s.signal = 'sell'
        }
      }
      cb()
    },
    onReport: function (s) {
      var cols = []
      if (typeof s.period.macd_histogram === 'number') {
        var color = 'grey'
        var color2 = 'grey'
        var colorK = 'grey'
        if (s.period.macd_histogram > 0) {
          color = 'green'
        }
        else if (s.period.macd_histogram < 0) {
          color = 'red'
        }
        s.period.srsi_K - s.period.srsi_D > 0 ? color2 = 'green' : color2 = 'red'
        s.period.srsi_K > s.lookback[0].srsi_K ? colorK = 'cyan' : colorK = 'blue'
        cols.push(z(8, n(s.period.macd_histogram).format('+00.0000'), ' ')[color])
        cols.push(z(8, n(s.period.srsi_K).format('00.00'), ' ')[colorK])
        cols.push(z(8, n(s.period.srsi_D).format('00.00'), ' ').magenta)
        cols.push(z(8, n(s.period.srsi_K - s.period.srsi_D).format('+00.00'), ' ')[color2])
      }
      else {
        cols.push('         ')
      }
      // console.log(s.period)
      // if (s.lookback[0]) {
      //   console.log(s.period.macd_histogram >= s.options.up_trend_threshold, s.period.srsi_K > s.period.srsi_D, s.period.srsi_K > s.lookback[0].srsi_K, s.period.srsi_K < s.options.oversold_rsi)
      // }
      return cols
    }
	}
}
