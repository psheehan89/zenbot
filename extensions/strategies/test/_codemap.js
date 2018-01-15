module.exports = {
  _ns: 'zenbot',

  'strategies.test': require('./strategy'),
  'strategies.list[]': '#strategies.test'
}
