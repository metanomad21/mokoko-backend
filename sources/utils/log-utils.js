import log4js from 'log4js'

const logger4 = {
  init: (name) => {
    //setup log
    let appendersObj = {}
    let categoriesObj = {}
    appendersObj['out'] = { type: 'console' }
    appendersObj[name] = {
      type: 'dateFile',
      filename: `./logs/${name}/normal`,
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true,
    }
    categoriesObj['default'] = { appenders: [name, 'out'], level: 'debug' }
    log4js.configure({
      appenders: appendersObj,
      categories: categoriesObj,
    })
    return log4js.getLogger(`[${name}]`)
  },
}

export default logger4
