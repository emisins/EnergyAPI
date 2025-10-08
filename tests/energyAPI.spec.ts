import { test, expect } from '@playwright/test'
import * as fuel from '../JSON/fuel.json'
import { extractGUID, verifyNewOrder } from '../util/helper'
import AJV from 'ajv'

const ajv = new AJV()

test.describe('GET endpoints for energy and orders should work and return valid JSON', () => {
    test('Energy prices API test', { tag: ['@smoke'] }, async ({ request }) => {
        const response = await request.get('/ENSEK/energy')
        expect(response.status()).toEqual(200)
        const energyPrices = await response.json()

        // Validate schema
        const valid = ajv.validate(require('../schemas/energy.schema.json'), energyPrices)
        if (!valid) {
            console.error('Schema validation Errors:', ajv.errorsText())
        }
        expect(valid).toBe(true)

        //validate some values
        expect(energyPrices.gas.energy_id).toBe(1)
        expect(energyPrices.nuclear.energy_id).toBe(2)
        expect(energyPrices.electric.energy_id).toBe(3)
        expect(energyPrices.oil.energy_id).toBe(4)
    })

    test('Orders API test', { tag: ['@smoke'] }, async ({ request }) => {
        const response = await request.get('/ENSEK/orders')
        expect(response.status()).toEqual(200)
        const orders = await response.json()

        // Validate schema
        const valid = ajv.validate(require('../schemas/orders.schema.json'), orders)
        if (!valid) {
            console.error('Schema validation Errors:', ajv.errorsText())
        }
        expect(valid).toBe(true)
    })
})

test.describe('PUT endpoint to buy energy should work', () => {
    test('Purchase of nuclear energy is not be possible', async ({ request }) => {
        const response = await request.put(`/ENSEK/buy/2/0`)
        expect(response.status()).toEqual(200)
        const responseMessage = await response.json()
        expect(responseMessage.message).toBe('There is no nuclear fuel to purchase!')
    })

    test('Purchase one unit of each energy type (except nuclear)', async ({ request }) => {
        const quantity = 1
        let ids = [fuel[0].energy_id, fuel[2].energy_id, fuel[3].energy_id]
        for (var id of ids) {
            const response = await request.put(`/ENSEK/buy/${id}/${quantity}`)
            expect(response.status()).toEqual(200)
            const purchase = await response.json()
            const purchaseGUID = await extractGUID(purchase)
            await verifyNewOrder(purchaseGUID, fuel[id - 1].name, quantity)
        }
    })
})

test.describe('PUT endpoint to buy energy - negative tests', () => {
    test('Invalid fuel ID returns error', async ({ request }) => {
        const response = await request.put(`/ENSEK/buy/7/0`)
        expect(response.status()).toEqual(400)
        const responseMessage = await response.json()
        expect(responseMessage.message).toBe('Bad request')
    })

    test('Invalid amount value returns error)', async ({ request }) => {
        const quantity = 1
        const response = await request.put(`/ENSEK/buy/1/fail`)
        expect(response.status()).toEqual(404)
        const responseMessage = await response.json()
        expect(responseMessage.message).toBe('Not Found')

    })
})

test.describe('Get amount of orders before given time', () => {
    test('Should be zero orders before Feb 1 2022', async ({ request }) => {
        const orderTime = "1 Feb 2022"
        const response = await request.get('/ENSEK/orders')
        expect(response.status()).toEqual(200)
        const allOrders = await response.json()
        const myOrder = allOrders.filter((x: { time: string }) => Date.parse(x.time) < Date.parse(orderTime))
        expect(myOrder.length).toEqual(0)
    })

    test('Should be three orders before 6am arch 10 2022', async ({ request }) => {
        const orderTime = "Thu, 10 Mar 2022 00:06:00 GMT"
        const response = await request.get('/ENSEK/orders')
        expect(response.status()).toEqual(200)
        const allOrders = await response.json()
        const myOrder = allOrders.filter((x: { time: string }) => Date.parse(x.time) < Date.parse(orderTime))
        expect(myOrder.length).toEqual(3)
    })

    test('Should be five orders before March 11 2022', async ({ request }) => {
        const orderTime = "11/03/2022"
        const response = await request.get('/ENSEK/orders')
        expect(response.status()).toEqual(200)
        const allOrders = await response.json()
        const myOrder = allOrders.filter((x: { time: string }) => Date.parse(x.time) < Date.parse(orderTime))
        expect(myOrder.length).toEqual(5)
    })

    test('Should output amount of orders created before current date', async ({ request }) => {
        const orderDate = new Date().toDateString()
        const response = await request.get('/ENSEK/orders')
        expect(response.status()).toEqual(200)
        const allOrders = await response.json()
        const myOrder = allOrders.filter((x: { time: string }) => Date.parse(x.time) < Date.parse(orderDate))
        expect(myOrder.length).toBeGreaterThanOrEqual(5)
        console.log(`Amount of orders created before today: ${myOrder.length}`)
    })
})

test.describe('Orders API tests without access token', () => {
    test('Get order by ID', async ({ request }) => {
        const orderGUID = "080d9823-e874-4b5b-99ff-2021f2a59b24"
        const response = await request.get(`/ENSEK/orders/${orderGUID}`)
        expect(response.status()).toEqual(500)
    })

    test('Delete order by ID', async ({ request }) => {
        const orderGUID = "080d9823-e874-4b5b-99ff-2021f2a59b24"
        const response = await request.delete(`/ENSEK/orders/${orderGUID}`)
        expect(response.status()).toEqual(500)
    })

    test('Update order by ID', async ({ request }) => {
        const orderGUID = "af9e8791-2492-458b-8bab-12a772e58308"
        const response = await request.put(`/ENSEK/orders/${orderGUID}`, {
            data: {
                "id": "af9e8791-2492-458b-8bab-12a772e58308",
                "quantity": 10,
                "energy_id": 1
            }
        })
        expect(response.status()).toEqual(500)
    })
})

test.describe('Orders API tests with access token', () => {

    test.beforeAll('get access token', async ({ request }) => {
        const responseToken = await request.post('/ENSEK/login', {
            data: {
                "username": `${process.env.USER_NAME}`,
                "password": `${process.env.PASSWORD}`
            }
        })
        expect(responseToken.status()).toEqual(200)
        const responseBody = await responseToken.json()
        const accessToken = responseBody.access_token
        process.env['ACCESS_TOKEN'] = accessToken
    })

    test('Get order by ID', async ({ request }) => {
        const orderGUID = "080d9823-e874-4b5b-99ff-2021f2a59b24"
        const response = await request.get(`/ENSEK/orders/${orderGUID}`, {
            headers: {
                Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
            }
        })
        expect(response.status()).toEqual(500)
    })

    test.skip('reset test data in API', async ({ request }) => {
        const response = await request.post('/ENSEK/reset', {
            headers: {
                Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
            }
        })
        expect(response.status()).toEqual(200)
    })
})