import { S3Event } from "aws-lambda";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  GetObjectCommandOutput,
} from "@aws-sdk/client-s3";

const FROM_PREFIX = "incoming";
const TO_PREFIX = "processed";

export const handler = async (event: S3Event) => {
  const results: string[] = [];

  for (const record of event.Records) {
    validateEventType(record);

    const client = new S3Client({ region: record.awsRegion });

    const { baseKey, sourceKey } = getObjectKeys(record);

    const obj = await client.send(
      new GetObjectCommand({
        Bucket: record.s3.bucket.name,
        Key: sourceKey,
      }),
    );

    const json = await csvToJson(obj.Body);

    await client.send(
      new PutObjectCommand({
        Bucket: record.s3.bucket.name,
        Key: `${TO_PREFIX}/${baseKey}`,
        Body: JSON.stringify(json, null, 2),
        ContentType: "application/json",
      }),
    );

    console.log("Meta: " + JSON.stringify(obj.Metadata));
    if (obj.Metadata?.["delete-after-processing"] == "true") {
      await client.send(
        new DeleteObjectCommand({
          Bucket: record.s3.bucket.name,
          Key: sourceKey,
        }),
      );
    }

    results.push(`${TO_PREFIX}/${baseKey}`);
  }

  return `Object(s) created: ${results.join(", ")}`;
};
function getObjectKeys(record: S3Event["Records"][0]) {
  const rawKey = record.s3.object.key;
  const sourceKey = decodeURIComponent(rawKey.replace(/\+/g, " "));

  if (!sourceKey.startsWith(`${FROM_PREFIX}/`)) {
    throw new Error(
      `Invalid object prefix. Expected: ${FROM_PREFIX}/. Received: ${sourceKey}`,
    );
  }

  const baseKey = sourceKey.slice(FROM_PREFIX.length + 1);

  if (!baseKey) {
    throw new Error("Object key does not contain a filename.");
  }

  return { sourceKey, baseKey };
}

function validateEventType(record: S3Event["Records"][0]): void {
  if (record.eventSource !== "aws:s3") {
    throw new Error(`Unexpected event source: ${record.eventSource}`);
  }

  if (!record.eventName.startsWith("ObjectCreated:")) {
    throw new Error(`Unexpected event name: ${record.eventName}`);
  }
}

async function csvToJson(body: GetObjectCommandOutput["Body"]) {
  if (!body) {
    throw new Error("S3 object has no body.");
  }

  const csv: string = await body.transformToString();

  const [headerLine, ...values] = csv
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");
  const headers = headerLine.split(",").map((x) => x.trim());

  return values.reduce((acc, line) => {
    const items = line.split(",");

    const row: any = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = items[i] ?? "";
    }

    acc.push(row);
    return acc;
  }, [] as object[]);
}
