const { FileQueue } = require('../../src/service')
const { testSetupHelper } = require('../TestSetupHelper')

jest.setTimeout(20000)

let queue

beforeAll(async () => {
  const dir = await testSetupHelper.createTmpDir()
  queue = new FileQueue(dir)
  await queue.init()
})

afterEach(async () => {
  await queue.clear()
})

afterAll(async () => {
  await testSetupHelper.deleteTmpDirs()
})

describe('Test operation cycle', () => {
  test('Test all ops push, pop, tpop, length, clear', async () => {
    const obj1 = {
      prop1: 'value1'
    }
    const obj2 = {
      prop1: 'value1',
      prop2: 10
    }

    const obj3 = {
      prop1: 'value1',
      prop2: true,
      prop3: {
        prop31: 5.5
      }
    }

    expect(await queue.length()).toBe(0)
    await queue.push(obj1)
    expect(await queue.length()).toBe(1)
    expect(await queue.pop()).toEqual(obj1)
    expect(await queue.length()).toBe(0)

    await queue.push(obj1)
    expect(await queue.length()).toBe(1)
    await queue.push(obj2)
    expect(await queue.length()).toBe(2)
    await queue.push(obj3)
    expect(await queue.length()).toBe(3)
    expect(await queue.pop()).toEqual(obj1)
    expect(await queue.length()).toBe(2)
    let trx = await queue.trxPop()
    expect(await queue.length()).toBe(1)
    expect(trx.getObj()).toEqual(obj2)
    await trx.rollback()
    expect(await queue.length()).toBe(2)
    trx = await queue.trxPop()
    expect(await queue.length()).toBe(1)
    expect(trx.getObj()).toEqual(obj2)
    await trx.commit()
    expect(await queue.length()).toBe(1)
    trx = await queue.trxPop()
    expect(await queue.length()).toBe(0)
    expect(trx.getObj()).toEqual(obj3)
    await trx.commit()
    expect(await queue.length()).toBe(0)

    await queue.push(obj1)
    expect(await queue.length()).toBe(1)
    await queue.push(obj2)
    expect(await queue.length()).toBe(2)
    await queue.clear()
    expect(await queue.length()).toBe(0)
  })
})
