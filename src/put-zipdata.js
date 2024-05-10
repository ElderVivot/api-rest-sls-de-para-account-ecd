import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { gzip, unzip } from 'zlib'
import { promisify } from 'util'
const gzipAsync = promisify(gzip)
const unzipAsync = promisify(unzip)

const TABLE_NAME = process.env.TABLE_NAME
const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

export async function PutData(event, context) {
    let body
    let statusCode = 200
    const headers = {
        "Content-Type": "application/json",
    }

    try {
        const bodyRequest = JSON.parse(event.body)

        let dataBody = Buffer.from(bodyRequest.data, 'base64')
        dataBody = await unzipAsync(dataBody)

        let requestJSON = JSON.parse(dataBody.toString())

        const bufferToSave = await gzipAsync(JSON.stringify(requestJSON))
        if (!bufferToSave) throw 'ERROR_ZLIB'

        await dynamo.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    id: requestJSON.id,
                    tenant: requestJSON.tenant,
                    federalRegistration: requestJSON.federalRegistration,
                    nameCompanie: requestJSON.nameCompanie,
                    codeOrClassification: requestJSON.codeOrClassification,
                    startPeriod: requestJSON.startPeriod,
                    endPeriod: requestJSON.endPeriod,
                    updatedAt: requestJSON.updatedAt,
                    url: requestJSON.url,
                    bufferToSave
                },
            })
        )
        body = `Put item ${requestJSON.id}`
    } catch (error) {
        statusCode = 400
        body = error.message
    } finally {
        body = JSON.stringify(body)
    }

    return {
        statusCode,
        body,
        headers,
    }
}