import { expect, request } from '@playwright/test'

export async function extractGUID(purchaseResponse: { message: string }) {
    const orderGUID = purchaseResponse.message.split(" ").reverse()[0].split(".").join("")
    return orderGUID
}

export async function verifyNewOrder(newId: string, fuel_name: string, newQuantity: number) {
    const apiRequest = await request.newContext()
    const allOrders = await (await apiRequest.get('/ENSEK/orders')).json()
    const myOrder = allOrders.filter((x: { Id?: string, id?: string }) => x.Id == newId || x.id == newId)
    expect(myOrder.length).toEqual(1)
    expect(myOrder[0].quantity).toEqual(newQuantity)
    expect(myOrder[0].fuel).toEqual(fuel_name)
}